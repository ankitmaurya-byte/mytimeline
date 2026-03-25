package models

import (
	"github.com/gorilla/websocket"
)

// Add adds a user to online users
func (ou *OnlineUsers) Add(userID string, conn *websocket.Conn) {
	ou.Mu.Lock()
	defer ou.Mu.Unlock()
	ou.Users[userID] = conn
}

// Remove removes a user from online users
func (ou *OnlineUsers) Remove(userID string) {
	ou.Mu.Lock()
	defer ou.Mu.Unlock()
	delete(ou.Users, userID)
}

// Get retrieves a user connection
func (ou *OnlineUsers) Get(userID string) (*websocket.Conn, bool) {
	ou.Mu.RLock()
	defer ou.Mu.RUnlock()
	conn, exists := ou.Users[userID]
	return conn, exists
}

// Count returns the number of online users
func (ou *OnlineUsers) Count() int {
	ou.Mu.RLock()
	defer ou.Mu.RUnlock()
	return len(ou.Users)
}

// NewOnlineUsers creates a new OnlineUsers instance
func NewOnlineUsers() *OnlineUsers {
	return &OnlineUsers{
		Users: make(map[string]*websocket.Conn),
	}
}
