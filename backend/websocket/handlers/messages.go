package handlers

import (
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
	"timeline-websocket/database"
)

func handleDisconnection(userID string) {
	log.Printf("User disconnected: %s", userID)

	// Update user's lastSeen in database when they disconnect
	now := time.Now()
	if err := database.UpdateUserLastSeen(userID, now); err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
	}

	OnlineUsers.Remove(userID)

	// Leave all workspace rooms and broadcast user offline
	// First, collect all workspaces the user is in
	type workspaceInfo struct {
		workspaceID string
		userName    string
	}
	var userWorkspaces []workspaceInfo

	WorkspaceRooms.Mu.Lock()
	for workspaceID, room := range WorkspaceRooms.Rooms {
		if userConn, exists := room[userID]; exists {
			userWorkspaces = append(userWorkspaces, workspaceInfo{
				workspaceID: workspaceID,
				userName:    userConn.UserName,
			})
			// Remove user from room
			delete(room, userID)
			// Clean up empty rooms
			if len(room) == 0 {
				delete(WorkspaceRooms.Rooms, workspaceID)
			}
		}
	}
	WorkspaceRooms.Mu.Unlock()

	// Now broadcast user offline to all workspaces (without holding the lock)
	for _, ws := range userWorkspaces {
		broadcastMsg := fmt.Sprintf(`{"type":"user-offline","userId":"%s","userName":"%s","lastSeen":"%s"}`,
			userID, ws.userName, time.Now().Format(time.RFC3339))
		log.Printf("📢 User %s left workspace %s, broadcasting offline status", userID, ws.workspaceID)
		WorkspaceRooms.Broadcast(ws.workspaceID, []byte(broadcastMsg), "")
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
