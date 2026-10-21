package com.spendwise.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "`users`")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 50) private String username;
    @Column(nullable = false, unique = true) private String email;
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(nullable = false, length = 20) private String role = "USER";
    @Column(nullable = false) private boolean enabled = true;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt = LocalDateTime.now();
    // getters/setters omitted for brevity; use Lombok if added
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; } public void setUsername(String u) { this.username = u; }
    public String getEmail() { return email; } public void setEmail(String e) { this.email = e; }
    public String getPasswordHash() { return passwordHash; } public void setPasswordHash(String p) { this.passwordHash = p; }
    public String getRole() { return role; } public void setRole(String r) { this.role = r; }
    public boolean isEnabled() { return enabled; } public void setEnabled(boolean e) { this.enabled = e; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
