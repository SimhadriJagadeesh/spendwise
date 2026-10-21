package com.spendwise.dto;

import com.spendwise.entity.User;

public record UserResponse(String username, String email, String role) {
    public static UserResponse of(User user) {
        return new UserResponse(user.getUsername(), user.getEmail(), user.getRole());
    }

    public static UserResponse of(String username) {
        return new UserResponse(username, "", "USER");
    }
}
