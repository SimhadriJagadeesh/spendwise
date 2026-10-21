package com.spendwise.dto;

import com.spendwise.entity.Category;

public record CategoryResponse(Long id, String name, String type, String color) {
    public static CategoryResponse of(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getType(), c.getColor());
    }
}
