package com.thecuratedcrate.shop.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTOs for Auth requests and responses
 */
public class AuthDto {

    // â”€â”€â”€ Signup Request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @Data
    public static class SignupRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be 2â€“100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @Pattern(regexp = "^(\\d{10})?$", message = "Phone must be 10 digits")
        private String phone;
    }

    // â”€â”€â”€ Login Request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // â”€â”€â”€ Auth Response (returned on login/signup) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @Data
    public static class AuthResponse {
        private String token;
        private String tokenType = "Bearer";
        private UserInfo user;

        public AuthResponse(String token, UserInfo user) {
            this.token = token;
            this.user = user;
        }
    }

    // â”€â”€â”€ User Info (safe subset, no password) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    @Data
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String createdAt;
    }
}

