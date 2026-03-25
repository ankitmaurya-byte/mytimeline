package handlers

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"timeline-websocket/auth"
	"timeline-websocket/database"
	"timeline-websocket/models"
)

var (
	Upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Production-ready origin check
			origin := r.Header.Get("Origin")
			allowedOrigins := getProductionOrigins()
			
			// Allow requests without Origin header (e.g., from k6 load tests, WebSocket clients)
			if origin == "" {
				return true
			}
			
			// Check if origin is in allowed list
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					return true
				}
			}
			
			// Log rejected origins for security monitoring
			log.Printf("⚠️ Rejected WebSocket connection from unauthorized origin: %s", origin)
			return false
		},
	}

	OnlineUsers    *models.OnlineUsers
	WorkspaceRooms *models.WorkspaceRooms
)

// Initialize initializes the handlers with dependencies
func Initialize() {
	OnlineUsers = models.NewOnlineUsers()
	WorkspaceRooms = models.NewWorkspaceRooms()
}

// HandleConnection handles WebSocket connections
func HandleConnection(w http.ResponseWriter, r *http.Request) {
	// Recover from panics to prevent server crash
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Issues in HandleConnection: %v", r)
		}
	}()

	// Upgrade HTTP connection to WebSocket
	conn, err := Upgrader.Upgrade(w, r, nil)
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

	// For load testing/development: accept test tokens
	var claims *models.Claims
	if strings.HasPrefix(token, "test-token-") {
		// Create a test claim from test token for load testing
		userId := strings.TrimPrefix(token, "test-token-")
		if userId == "" {
			userId = "test-user"
		}
		claims = &models.Claims{
			UserID: userId,
			Sub:    userId,
		}
		log.Printf("✅ Accepted test token for user: %s (load testing mode)", userId)
	} else {
		// Validate as real JWT
		var authErr error
		claims, authErr = auth.AuthenticateToken(token)
		if authErr != nil {
			log.Printf("Authentication failed: %v", authErr)
			conn.WriteJSON(map[string]string{"error": "Authentication failed"})
			return
		}
	}

	userID := claims.UserID
	if userID == "" {
		userID = claims.Sub // Fallback to sub field
	}
	log.Printf("User connected: %s", userID)

	// Update user's lastSeen in database when they connect
	now := time.Now()
	if err := database.UpdateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	// Add user to online users
	OnlineUsers.Add(userID, conn)

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
	handleDisconnection(userID)
}

// getProductionOrigins returns allowed origins for WebSocket connections
func getProductionOrigins() []string {
	// Check ALLOWED_ORIGINS first, then fallback to CORS_ADDITIONAL_ORIGINS
	envOrigins := os.Getenv("ALLOWED_ORIGINS")
	if envOrigins == "" {
		envOrigins = os.Getenv("CORS_ADDITIONAL_ORIGINS")
	}
	
	if envOrigins == "" {
		log.Println("⚠️  WARNING: ALLOWED_ORIGINS or CORS_ADDITIONAL_ORIGINS not set! WebSocket connections will be rejected.")
		log.Println("   Set environment variable: export ALLOWED_ORIGINS=\"https://yourdomain.com\"")
		return []string{}
	}
	
	// Split comma-separated origins and trim whitespace
	origins := strings.Split(envOrigins, ",")
	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}
	
	log.Printf("✅ Allowed WebSocket origins: %v", origins)
	return origins
}
