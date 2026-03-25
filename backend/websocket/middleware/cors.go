package middleware

import (
	"net/http"
	"os"
	"strings"
)

// adds CORS headers to HTTP responses
func EnableCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get allowed origins from environment (production-ready)
		allowedOrigins := getProductionOrigins()
		origin := r.Header.Get("Origin")
		
		// Check if origin is allowed
		if isOriginAllowed(origin, allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		
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

// getProductionOrigins returns allowed origins for production
func getProductionOrigins() []string {
	// Check ALLOWED_ORIGINS first, then fallback to CORS_ADDITIONAL_ORIGINS
	envOrigins := os.Getenv("ALLOWED_ORIGINS")
	if envOrigins == "" {
		envOrigins = os.Getenv("CORS_ADDITIONAL_ORIGINS")
	}
	
	if envOrigins == "" {
		return []string{} // No origins allowed if not configured
	}
	
	// Split comma-separated origins and trim whitespace
	origins := strings.Split(envOrigins, ",")
	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}
	
	return origins
}

// isOriginAllowed checks if the origin is in the allowed list
func isOriginAllowed(origin string, allowed []string) bool {
	for _, o := range allowed {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}
