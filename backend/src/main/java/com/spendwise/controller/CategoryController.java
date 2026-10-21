package com.spendwise.controller;

import com.spendwise.dto.CategoryRequest;
import com.spendwise.dto.CategoryResponse;
import com.spendwise.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal String username) {
        return categoryService.list(username);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> get(@AuthenticationPrincipal String username, @PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getOne(username, id));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@AuthenticationPrincipal String username,
                                                   @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.create(username, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@AuthenticationPrincipal String username,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(username, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String username, @PathVariable Long id) {
        categoryService.delete(username, id);
        return ResponseEntity.noContent().build();
    }
}
