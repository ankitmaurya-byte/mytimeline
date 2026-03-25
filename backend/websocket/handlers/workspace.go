package handlers

import (
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
	"timeline-websocket/database"
)

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
	if err := database.UpdateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	// Join the workspace room
	WorkspaceRooms.Join(workspaceID, userID, userName, conn)

	// Broadcast user joined (send as user-online to match frontend expectations)
	WorkspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-online","userId":"%s","userName":"%s","timestamp":"%s"}`, userID, userName, time.Now().Format(time.RFC3339))), userID)

	// Send current online users list to the new user with database lastSeen data
	onlineUsersList := []map[string]interface{}{}
	users := WorkspaceRooms.GetUsers(workspaceID)
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
	WorkspaceRooms.Leave(workspaceID, userID)

	// Broadcast user left
	WorkspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-offline","userId":"%s","lastSeen":"%s"}`, userID, time.Now().Format(time.RFC3339))), "")

	// Send confirmation to user
	conn.WriteJSON(map[string]interface{}{
		"type":        "left_workspace",
		"workspaceId": workspaceID,
	})
}

func handleUserActivity(userID string, conn *websocket.Conn, msg map[string]interface{}) {
	// Update lastSeen in database
	now := time.Now()
	if err := database.UpdateUserLastSeen(userID, now); err != nil {
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
	WorkspaceRooms.Broadcast(workspaceID, []byte(fmt.Sprintf(`{"type":"user-activity","userId":"%s","lastSeen":"%s"}`, userID, now.Format(time.RFC3339))), userID)
}
