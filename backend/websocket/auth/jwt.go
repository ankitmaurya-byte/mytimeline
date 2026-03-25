package auth

import (
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"timeline-websocket/models"
)

// GetJWTSecret returns the JWT secret from environment
func GetJWTSecret() string {
	return os.Getenv("JWT_SECRET")
}

var jwtSecret string

func init() {
	jwtSecret = GetJWTSecret()
}

// AuthenticateToken validates a JWT token and returns claims
func AuthenticateToken(tokenString string) (*models.Claims, error) {
	// Get fresh JWT secret in case it was loaded after package init
	secret := GetJWTSecret()
	if secret == "" {
		return nil, fmt.Errorf("JWT_SECRET not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &models.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*models.Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}
