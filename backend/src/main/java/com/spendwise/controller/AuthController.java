package com.spendwise.controller;

import com.spendwise.dto.LoginRequest;
import com.spendwise.dto.RegisterRequest;
import com.spendwise.dto.UserResponse;
import com.spendwise.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final com.spendwise.repository.UserRepository userRepository;

    public AuthController(AuthService authService, com.spendwise.repository.UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.username(), request.email(), request.password());
        return ResponseEntity.status(201).body(Map.of("message", "Account created"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request.usernameOrEmail(), request.password());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal String username) {
        com.spendwise.entity.User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            return ResponseEntity.ok(UserResponse.of(user));
        }
        return ResponseEntity.ok(UserResponse.of(username));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Stateless JWT: the client discards the token. No server-side state to clear.
        return ResponseEntity.ok(Map.of("message", "Signed out"));
    }
}
