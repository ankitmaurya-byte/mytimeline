package models

import (
	"log"

	"github.com/gorilla/websocket"
)

// note     Join adds a user to a workspace room
func (wr *WorkspaceRooms) Join(workspaceID, userID, userName string, conn *websocket.Conn) {
	wr.Mu.Lock()
	defer wr.Mu.Unlock()
	if wr.Rooms[workspaceID] == nil {
		wr.Rooms[workspaceID] = make(map[string]*UserConnection)
	}
	wr.Rooms[workspaceID][userID] = &UserConnection{
		UserID:   userID,
		UserName: userName,
		Conn:     conn,
	}
}

// w         Leave removes a user from a workspace room
func (wr *WorkspaceRooms) Leave(workspaceID, userID string) {
	wr.Mu.Lock()
	defer wr.Mu.Unlock()
	if room, exists := wr.Rooms[workspaceID]; exists {
		delete(room, userID)
		if len(room) == 0 {
			delete(wr.Rooms, workspaceID)
		}
	}
}

// r          Broadcast sends a message to all users in a workspace room
func (wr *WorkspaceRooms) Broadcast(workspaceID string, message []byte, excludeUserID string) {
	wr.Mu.RLock()
	defer wr.Mu.RUnlock()
	if room, exists := wr.Rooms[workspaceID]; exists {
		log.Printf("Broadcasting to workspace %s: %d users (excluding %s)", workspaceID, len(room), excludeUserID)
		log.Printf("Message: %s", string(message))
		for userID, userConn := range room {
			if userID != excludeUserID {
				log.Printf("Sending to user %s", userID)
				if err := userConn.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
					log.Printf("Error broadcasting to user %s: %v", userID, err)
				} else {
					log.Printf("Successfully sent to user %s", userID)
				}
			} else {
				log.Printf("⏭️  Skipping excluded user %s", userID)
			}
		}
	} else {
		log.Printf("No room found for workspace %s", workspaceID)
	}
}

// GetUsers returns all users in a workspace room for 
func (wr *WorkspaceRooms) GetUsers(workspaceID string) []*UserConnection {
	wr.Mu.RLock()
	defer wr.Mu.RUnlock()
	var users []*UserConnection
	if room, exists := wr.Rooms[workspaceID]; exists {
		for _, userConn := range room {
			users = append(users, userConn)
		}
	}
	return users
}

// NewWorkspaceRooms creates a new WorkspaceRooms instance
func NewWorkspaceRooms() *WorkspaceRooms {
	return &WorkspaceRooms{
		Rooms: make(map[string]map[string]*UserConnection),
	}
}
