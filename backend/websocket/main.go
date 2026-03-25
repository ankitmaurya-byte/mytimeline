package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"timeline-websocket/auth"
	"timeline-websocket/database"
	"timeline-websocket/handlers"
	"timeline-websocket/middleware"
)

func main() {
	// Check if running in production
	env := os.Getenv("NODE_ENV")
	isProduction := env == "production"

	// Only load .env files in development
	if !isProduction {
		// Development: Try loading .env first (websocket/.env), then parent directory
		if err := godotenv.Load(".env"); err != nil {
			log.Println("⚠️  No .env file found, trying ../.env.local")
			// Fallback to .env.local in parent directory (backend/.env.local)
			if err := godotenv.Load("../.env.local"); err != nil {
				log.Println("⚠️  No ../.env.local file found, using system environment variables")
			} else {
				log.Println("✅ Loaded environment variables from ../.env.local")
			}
		} else {
			log.Println("✅ Loaded environment variables from .env (websocket/.env)")
		}
	} else {
		// Production: Use system environment variables only
		log.Println("🚀 Production mode: Using system environment variables")
	}

	// Validate JWT secret
	if auth.GetJWTSecret() == "" {
		log.Fatal("❌ JWT_SECRET environment variable is required")
	}

	// Validate required environment variables in production
	if isProduction {
		// Check ALLOWED_ORIGINS or CORS_ADDITIONAL_ORIGINS
		allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
		corsOrigins := os.Getenv("CORS_ADDITIONAL_ORIGINS")
		if allowedOrigins == "" && corsOrigins == "" {
			log.Fatal("❌ ALLOWED_ORIGINS or CORS_ADDITIONAL_ORIGINS environment variable is required in production")
		}

		// Check MONGO_URI
		mongoURI := os.Getenv("MONGO_URI")
		if mongoURI == "" {
			log.Fatal("❌ MONGO_URI environment variable is required in production")
		}

		log.Println("✅ All required environment variables validated")
	}

	// Get port from environment
	port := os.Getenv("WS_PORT")
	if port == "" {
		port = "8001" // Default to 8001 for WebSocket
	}

	// Initialize database
	if err := database.InitDatabase(); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// Initialize handlers
	handlers.Initialize()

	// Set up routes
	http.HandleFunc("/ws", middleware.EnableCORS(handlers.HandleConnection))
	http.HandleFunc("/api/health", middleware.EnableCORS(handlers.HealthCheck))

	// Start server
	log.Printf("WebSocket server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
