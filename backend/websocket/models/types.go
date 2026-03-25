package models

import (
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

// JWT claims structure
type Claims struct {
	UserID string `json:"userId,omitempty"` // Try userId first
	Sub    string `json:"sub,omitempty"`    // Fallback to sub
	jwt.RegisteredClaims
}

// User data structure
type UserData struct {
	UserID string      `json:"userId"`
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
	ID       string     `bson:"_id,omitempty"`
	Name     string     `bson:"name"`
	Email    string     `bson:"email"`
	LastSeen *time.Time `bson:"lastSeen,omitempty"`
}

// Online users store
type OnlineUsers struct {
	Mu    sync.RWMutex
	Users map[string]*websocket.Conn
}

// Workspace rooms
type WorkspaceRooms struct {
	Mu    sync.RWMutex
	Rooms map[string]map[string]*UserConnection // workspaceID -> userID -> userConnection
}
