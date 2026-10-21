package com.spendwise.service;

import com.spendwise.dto.CategoryRequest;
import com.spendwise.dto.CategoryResponse;
import com.spendwise.entity.Category;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.CategoryRepository;
import com.spendwise.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;

    public CategoryService(CategoryRepository categoryRepo, UserRepository userRepo) {
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(String username) {
        return categoryRepo.findByUserUsernameOrderByNameAsc(username).stream()
                .map(CategoryResponse::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getOne(String username, Long id) {
        return CategoryResponse.of(categoryRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Category not found")));
    }

    @Transactional
    public CategoryResponse create(String username, CategoryRequest request) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated user not found"));

        if (categoryRepo.existsByUserUsernameAndNameIgnoreCase(username, request.name().trim())) {
            throw ApiException.conflict("A category with that name already exists");
        }

        Category newCategory = new Category();
        newCategory.setUser(user);
        apply(newCategory, request);
        return CategoryResponse.of(categoryRepo.save(newCategory));
    }

    @Transactional
    public CategoryResponse update(String username, Long id, CategoryRequest request) {
        Category existingCategory = categoryRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        // The table has a unique key on (user_id, name). Checking here turns a
        // constraint violation into a 409 instead of an opaque 500.
        String newName = request.name().trim();
        if (!newName.equalsIgnoreCase(existingCategory.getName())
                && categoryRepo.existsByUserUsernameAndNameIgnoreCase(username, newName)) {
            throw ApiException.conflict("A category with that name already exists");
        }
        apply(existingCategory, request);
        return CategoryResponse.of(categoryRepo.save(existingCategory));
    }

    @Transactional
    public void delete(String username, Long id) {
        Category categoryToDelete = categoryRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        // Transactions keep their history; the foreign key nulls the category
        // reference.
        categoryRepo.delete(categoryToDelete);
    }

    private void apply(Category target, CategoryRequest request) {
        target.setName(request.name().trim());
        if (request.type() == null || request.type().isBlank()) {
            throw ApiException.badRequest("Category type is required");
        }
        String upperType = request.type().trim().toUpperCase();
        if (!upperType.equals("INCOME") && !upperType.equals("EXPENSE")) {
            throw ApiException.badRequest("Category type must be INCOME or EXPENSE");
        }
        target.setType(upperType);
        if (request.color() != null && !request.color().isBlank()) {
            String color = request.color().trim();
            if (!color.matches("^#[0-9A-Fa-f]{6}$")) {
                throw ApiException.badRequest("Color must be a valid 6-digit hex color (e.g. #4F46E5)");
            }
            target.setColor(color);
        }
    }
}
