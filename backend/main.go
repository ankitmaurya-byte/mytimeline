package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// JWT claims structure
type Claims struct {
	UserID string `json:"userId,omitempty"`  // Try userId first
	Sub    string `json:"sub,omitempty"`     // Fallback to sub
	jwt.RegisteredClaims
}

// User data structure
type UserData struct {
	UserID string `json:"userId"`
	User   interface{} `json:"user"`
}

// User connection data
type UserConnection struct {
	UserID   string
	UserName string
	Conn     *websocket.Conn
}

// Database user structure
type DBUser struct {
	ID       string    `bson:"_id,omitempty"`
	Name     string    `bson:"name"`
	Email    string    `bson:"email"`
	LastSeen *time.Time `bson:"lastSeen,omitempty"`
}

// Online users store
type OnlineUsers struct {
	mu    sync.RWMutex
	users map[string]*websocket.Conn
}

func (ou *OnlineUsers) Add(userID string, conn *websocket.Conn) {
	ou.mu.Lock()
	defer ou.mu.Unlock()
	ou.users[userID] = conn
}

func (ou *OnlineUsers) Remove(userID string) {
	ou.mu.Lock()
	defer ou.mu.Unlock()
	delete(ou.users, userID)
}

func (ou *OnlineUsers) Get(userID string) (*websocket.Conn, bool) {
	ou.mu.RLock()
	defer ou.mu.RUnlock()
	conn, exists := ou.users[userID]
	return conn, exists
}

func (ou *OnlineUsers) Count() int {
	ou.mu.RLock()
	defer ou.mu.RUnlock()
	return len(ou.users)
}

// Workspace rooms
type WorkspaceRooms struct {
	mu     sync.RWMutex
	rooms  map[string]map[string]*UserConnection // workspaceID -> userID -> userConnection
}

func (wr *WorkspaceRooms) Join(workspaceID, userID, userName string, conn *websocket.Conn) {
	wr.mu.Lock()
	defer wr.mu.Unlock()
	if wr.rooms[workspaceID] == nil {
		wr.rooms[workspaceID] = make(map[string]*UserConnection)
	}
	wr.rooms[workspaceID][userID] = &UserConnection{
		UserID:   userID,
		UserName: userName,
		Conn:     conn,
	}
}

func (wr *WorkspaceRooms) Leave(workspaceID, userID string) {
	wr.mu.Lock()
	defer wr.mu.Unlock()
	if room, exists := wr.rooms[workspaceID]; exists {
		delete(room, userID)
		if len(room) == 0 {
			delete(wr.rooms, workspaceID)
		}
	}
}

func (wr *WorkspaceRooms) Broadcast(workspaceID string, message []byte, excludeUserID string) {
	wr.mu.RLock()
	defer wr.mu.RUnlock()
	if room, exists := wr.rooms[workspaceID]; exists {
		log.Printf("📢 Broadcasting to workspace %s: %d users (excluding %s)", workspaceID, len(room), excludeUserID)
		log.Printf("📢 Message: %s", string(message))
		for userID, userConn := range room {
			if userID != excludeUserID {
				log.Printf("📤 Sending to user %s", userID)
				if err := userConn.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
					log.Printf("❌ Error broadcasting to user %s: %v", userID, err)
				} else {
					log.Printf("✅ Successfully sent to user %s", userID)
				}
			} else {
				log.Printf("⏭️  Skipping excluded user %s", userID)
			}
		}
	} else {
		log.Printf("⚠️  No room found for workspace %s", workspaceID)
	}
}

func (wr *WorkspaceRooms) GetUsers(workspaceID string) []*UserConnection {
	wr.mu.RLock()
	defer wr.mu.RUnlock()
	var users []*UserConnection
	if room, exists := wr.rooms[workspaceID]; exists {
		for _, userConn := range room {
			users = append(users, userConn)
		}
	}
	return users
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow connections from any origin for now
			// In production, you should check against allowed origins
			return true
		},
	}

	onlineUsers = &OnlineUsers{users: make(map[string]*websocket.Conn)}
	workspaceRooms = &WorkspaceRooms{rooms: make(map[string]map[string]*UserConnection)}
	jwtSecret = os.Getenv("JWT_SECRET")
	mongoClient *mongo.Client
	usersCollection *mongo.Collection
)

func authenticateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func initDatabase() error {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb+srv://ankitmaurya2989_db_user:d7X9ena0VeHqy7Jo@cluster0.ytkeufu.mongodb.net/?appName=Cluster0"
	}

	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	if err := client.Ping(context.Background(), nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	mongoClient = client
	// Use timelineDB as specified in the connection URI
	usersCollection = client.Database("timelineDB").Collection("users")
	log.Println("Connected to MongoDB successfully")
	return nil
}

func updateUserLastSeen(userID string, lastSeen time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Invalid user ID format %s: %v", userID, err)
		return err
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": bson.M{"lastSeen": lastSeen}}

	result, err := usersCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
		return err
	}

	log.Printf("Updated lastSeen for user %s: %v (matched: %d, modified: %d)", userID, lastSeen, result.MatchedCount, result.ModifiedCount)
	return nil
}

func getWorkspaceMembers(workspaceID string) ([]DBUser, error) {
	// For now, return empty slice - we'll need to implement workspace member lookup
	// This would require accessing the workspace members from the database
	// For the summary implementation, we'll focus on the core lastSeen functionality
	return []DBUser{}, nil
}

func enableCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the original handler
		handler(w, r)
	}
}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	// Recover from panics to prevent server crash
	defer func() {
		if r := recover(); r != nil {
			log.Printf("🚨 Panic in handleConnection: %v", r)
		}
	}()
	
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	// Authenticate user
	token := r.URL.Query().Get("token")
	if token == "" {
		// Try to get token from headers
		token = r.Header.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}
	}

	if token == "" {
		log.Println("No authentication token provided")
		conn.WriteJSON(map[string]string{"error": "Authentication token required"})
		return
	}

	claims, err := authenticateToken(token)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		conn.WriteJSON(map[string]string{"error": "Authentication failed"})
		return
	}

	userID := claims.UserID
	if userID == "" {
		userID = claims.Sub  // Fallback to sub field
	}
	log.Printf("User connected: %s", userID)

	// Update user's lastSeen in database when they connect
	now := time.Now()
	if err := updateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	// Add user to online users
	onlineUsers.Add(userID, conn)

	// Handle connection
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading message from user %s: %v", userID, err)
			break
		}

		handleMessage(userID, conn, msg)
	}

	// Clean up when user disconnects
	log.Printf("User disconnected: %s", userID)

	// Update user's lastSeen in database when they disconnect
	now = time.Now()
	if err := updateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	onlineUsers.Remove(userID)

	// Leave all workspace rooms and broadcast user offline
	// First, collect all workspaces the user is in
	type workspaceInfo struct {
		workspaceID string
		userName    string
	}
	var userWorkspaces []workspaceInfo
	
	workspaceRooms.mu.Lock()
	for workspaceID, room := range workspaceRooms.rooms {
		if userConn, exists := room[userID]; exists {
			userWorkspaces = append(userWorkspaces, workspaceInfo{
				workspaceID: workspaceID,
				userName:    userConn.UserName,
			})
			// Remove user from room
			delete(room, userID)
			// Clean up empty rooms
			if len(room) == 0 {
				delete(workspaceRooms.rooms, workspaceID)
			}
		}
	}
	workspaceRooms.mu.Unlock()
	
	// Now broadcast user offline to all workspaces (without holding the lock)
	for _, ws := range userWorkspaces {
		broadcastMsg := fmt.Sprintf(`{"type":"user-offline","userId":"%s","userName":"%s","lastSeen":"%s"}`, 
			userID, ws.userName, time.Now().Format(time.RFC3339))
		log.Printf("📢 User %s left workspace %s, broadcasting offline status", userID, ws.workspaceID)
		workspaceRooms.Broadcast(ws.workspaceID, []byte(broadcastMsg), "")
	}
}

func handleMessage(userID string, conn *websocket.Conn, msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		log.Printf("Invalid message format from user %s", userID)
		return
	}

	switch msgType {
	case "join-workspace":
		handleJoinWorkspace(userID, conn, msg)
	case "leave-workspace":
		handleLeaveWorkspace(userID, conn, msg)
	case "user-activity":
		handleUserActivity(userID, conn, msg)
	case "ping":
		conn.WriteJSON(map[string]string{"type": "pong"})
	default:
		log.Printf("Unknown message type: %s from user %s", msgType, userID)
	}
}

func handleJoinWorkspace(userID string, conn *websocket.Conn, msg map[string]interface{}) {
	workspaceID, ok := msg["workspaceId"].(string)
	if !ok {
		log.Printf("Invalid workspaceId in join-workspace from user %s", userID)
		return
	}

	userName, _ := msg["userName"].(string)

	log.Printf("User %s (%s) joining workspace %s", userID, userName, workspaceID)

	// Update user's lastSeen in database when joining workspace
	now := time.Now()
	if err := updateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	// Join the workspace room
	workspaceRooms.Join(workspaceID, userID, userName, conn)

	// Broadcast user joined (send as user-online to match frontend expectations)
	workspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-online","userId":"%s","userName":"%s","timestamp":"%s"}`, userID, userName, time.Now().Format(time.RFC3339))), userID)

	// Send current online users list to the new user with database lastSeen data
	onlineUsersList := []map[string]interface{}{}
	users := workspaceRooms.GetUsers(workspaceID)
	for _, userConn := range users {
		// Include ALL users in the workspace (including self)
		// For online users, use current time as lastSeen (they're active now)
		onlineUsersList = append(onlineUsersList, map[string]interface{}{
			"userId":   userConn.UserID,
			"userName": userConn.UserName,
			"lastSeen": now.Format(time.RFC3339),
			"isOnline": true,
		})
	}

	log.Printf("📤 Sending online-users list to %s: %d users", userID, len(onlineUsersList))
	if err := conn.WriteJSON(map[string]interface{}{
		"type":  "online-users",
		"users": onlineUsersList,
	}); err != nil {
		log.Printf("❌ Failed to send online-users to %s: %v", userID, err)
	} else {
		log.Printf("✅ Successfully sent online-users to %s", userID)
	}

	// Send confirmation to user
	log.Printf("📤 Sending joined_workspace confirmation to %s", userID)
	if err := conn.WriteJSON(map[string]interface{}{
		"type":        "joined_workspace",
		"workspaceId": workspaceID,
	}); err != nil {
		log.Printf("❌ Failed to send joined_workspace to %s: %v", userID, err)
	} else {
		log.Printf("✅ Successfully sent joined_workspace to %s", userID)
	}
}

func handleLeaveWorkspace(userID string, conn *websocket.Conn, msg map[string]interface{}) {
	workspaceID, ok := msg["workspaceId"].(string)
	if !ok {
		log.Printf("Invalid workspaceId in leave-workspace from user %s", userID)
		return
	}

	log.Printf("User %s leaving workspace %s", userID, workspaceID)

	// Leave the workspace room
	workspaceRooms.Leave(workspaceID, userID)

	// Broadcast user left
	workspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-offline","userId":"%s","lastSeen":"%s"}`, userID, time.Now().Format(time.RFC3339))), "")

	// Send confirmation to user
	conn.WriteJSON(map[string]interface{}{
		"type": "left_workspace",
		"workspaceId": workspaceID,
	})
}

func handleUserActivity(userID string, conn *websocket.Conn, msg map[string]interface{}) {
	// Update lastSeen in database
	now := time.Now()
	if err := updateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
		return
	}

	// Broadcast activity to other users in the workspace
	// We need to get the workspace ID from the message or from the user's current rooms
	workspaceID, ok := msg["workspaceId"].(string)
	if !ok {
		log.Printf("Invalid workspaceId in user-activity from user %s", userID)
		return
	}

	// Broadcast user activity to other users in the workspace
	workspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-activity","userId":"%s","lastSeen":"%s"}`, userID, now.Format(time.RFC3339))), userID)
}

func main() {
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	port := os.Getenv("WS_PORT") // Use WS_PORT for WebSocket server
	if port == "" {
		port = "8001" // Default to 8001 for WebSocket
	}

	// MongoDB setup
	err := initDatabase()
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Set up routes
	http.HandleFunc("/ws", enableCORS(handleConnection))
	http.HandleFunc("/api/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"websocket-server"}`))
	}))

	log.Printf("Combined server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}