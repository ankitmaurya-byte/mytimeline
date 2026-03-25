package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"timeline-websocket/models"
)

var (
	MongoClient     *mongo.Client
	UsersCollection *mongo.Collection
)

// InitDatabase initializes the MongoDB connection
func InitDatabase() error {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		return fmt.Errorf("MONGO_URI environment variable is required")
	}

	log.Printf("Connecting to MongoDB...")
	
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	if err := client.Ping(context.Background(), nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	MongoClient = client
	// Use timelineDB as specified in the connection URI
	UsersCollection = client.Database("timelineDB").Collection("users")
	log.Println("✅ Connected to MongoDB successfully")
	return nil
}

// UpdateUserLastSeen updates the lastSeen timestamp for a user
func UpdateUserLastSeen(userID string, lastSeen time.Time) error {
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

	result, err := UsersCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("Failed to update lastSeen for user %s: %v", userID, err)
		return err
	}

	log.Printf("Updated lastSeen for user %s: %v (matched: %d, modified: %d)", userID, lastSeen, result.MatchedCount, result.ModifiedCount)
	return nil
}

// GetWorkspaceMembers retrieves all members of a workspace
func GetWorkspaceMembers(workspaceID string) ([]models.DBUser, error) {
	// For now, return empty slice - we'll need to implement workspace member lookup
	// This would require accessing the workspace members from the database
	// For the summary implementation, we'll focus on the core lastSeen functionality
	return []models.DBUser{}, nil
}
