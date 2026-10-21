package com.spendwise.controller;

import com.spendwise.entity.Transaction;
import com.spendwise.entity.User;
import com.spendwise.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Administrative endpoints. Restricted to users with the ADMIN role.
 * Gives admin complete visibility into platform activity, users, transactions,
 * and user-specific financial records.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final CategoryRepository categoryRepository;

    public AdminController(UserRepository userRepository,
                           TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository,
                           SavingsGoalRepository savingsGoalRepository,
                           CategoryRepository categoryRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("activeUsers", userRepository.countByEnabledTrue());
        stats.put("totalTransactions", transactionRepository.count());
        stats.put("totalBudgets", budgetRepository.count());
        stats.put("totalGoals", savingsGoalRepository.count());
        stats.put("totalCategories", categoryRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<Map<String, Object>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);

        Page<Map<String, Object>> result = userRepository.findAll(PageRequest.of(safePage, safeSize))
                .map(user -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", user.getId());
                    item.put("username", user.getUsername());
                    item.put("email", user.getEmail());
                    item.put("role", user.getRole());
                    item.put("enabled", user.isEnabled());
                    item.put("createdAt", user.getCreatedAt());
                    return item;
                });
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot disable an Administrator account"));
        }
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("enabled", user.isEnabled(), "message", "User status updated"));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if ("ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete an Administrator account"));
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User and all associated data deleted"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<Map<String, Object>>> listAllTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);

        Page<Transaction> txPage = transactionRepository.findAllAdmin(
                search != null && !search.isBlank() ? search.trim() : null,
                type != null && !type.isBlank() ? type.trim().toUpperCase() : null,
                PageRequest.of(safePage, safeSize)
        );

        Page<Map<String, Object>> result = txPage.map(tx -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", tx.getId());
            map.put("username", tx.getUser().getUsername());
            map.put("userEmail", tx.getUser().getEmail());
            map.put("type", tx.getType());
            map.put("description", tx.getDescription());
            map.put("merchant", tx.getMerchant());
            map.put("amount", tx.getAmount());
            map.put("currency", tx.getCurrency());
            map.put("transactionDate", tx.getTransactionDate());
            map.put("categoryName", tx.getCategory() != null ? tx.getCategory().getName() : "Uncategorised");
            map.put("createdAt", tx.getCreatedAt());
            return map;
        });

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id) {
        if (!transactionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        transactionRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted by admin"));
    }

    @GetMapping("/users/{id}/details")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("id", user.getId());
        details.put("username", user.getUsername());
        details.put("email", user.getEmail());
        details.put("role", user.getRole());
        details.put("enabled", user.isEnabled());
        details.put("createdAt", user.getCreatedAt());

        details.put("transactions", transactionRepository.findByUserUsernameOrderByTransactionDateDesc(user.getUsername()));
        details.put("budgets", budgetRepository.findByUserUsername(user.getUsername()));
        details.put("goals", savingsGoalRepository.findByUserUsernameOrderByCreatedAtDesc(user.getUsername()));
        details.put("categories", categoryRepository.findByUserUsernameOrderByNameAsc(user.getUsername()));

        return ResponseEntity.ok(details);
    }
}
