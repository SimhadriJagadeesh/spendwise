package com.spendwise.service;

import com.spendwise.dto.BudgetRequest;
import com.spendwise.dto.BudgetResponse;
import com.spendwise.entity.Budget;
import com.spendwise.entity.BudgetPeriod;
import com.spendwise.entity.Category;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.BudgetRepository;
import com.spendwise.repository.CategoryRepository;
import com.spendwise.repository.TransactionRepository;
import com.spendwise.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class BudgetService {
    private static final BigDecimal WARNING_THRESHOLD = new BigDecimal("80");

    private final BudgetRepository budgetRepo;
    private final CategoryRepository categoryRepo;
    private final TransactionRepository transactionRepo;
    private final UserRepository userRepo;

    public BudgetService(BudgetRepository budgetRepo,
                         CategoryRepository categoryRepo,
                         TransactionRepository transactionRepo,
                         UserRepository userRepo) {
        this.budgetRepo = budgetRepo;
        this.categoryRepo = categoryRepo;
        this.transactionRepo = transactionRepo;
        this.userRepo = userRepo;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(String username) {
        LocalDate now = LocalDate.now();
        return budgetRepo.findByUserUsername(username).stream()
                .map(b -> toResponse(b, spentFor(b, now)))
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse getOne(String username, Long id) {
        Budget budget = budgetRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));
        return toResponse(budget, spentFor(budget, LocalDate.now()));
    }

    @Transactional
    public BudgetResponse create(String username, BudgetRequest request) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated user not found"));

        if (request.period() == null || request.period().isBlank()) {
            throw ApiException.badRequest("Period must be MONTHLY or YEARLY");
        }
        BudgetPeriod period;
        try {
            period = BudgetPeriod.valueOf(request.period().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Period must be MONTHLY or YEARLY");
        }
        String month = normalizeMonth(period, request.month());

        Category category = resolveCategory(username, request.categoryId());

        rejectDuplicate(username, month, category, null);

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setPeriod(period);
        budget.setMonth(month);
        budget.setAmount(request.amount());
        budget.setCurrency(request.currency().trim().toUpperCase());

        Budget saved = budgetRepo.save(budget);
        return toResponse(saved, spentFor(saved, LocalDate.now()));
    }

    @Transactional
    public BudgetResponse update(String username, Long id, BudgetRequest request) {
        Budget budget = budgetRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));

        if (request.period() == null || request.period().isBlank()) {
            throw ApiException.badRequest("Period must be MONTHLY or YEARLY");
        }
        BudgetPeriod period;
        try {
            period = BudgetPeriod.valueOf(request.period().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Period must be MONTHLY or YEARLY");
        }
        String month = normalizeMonth(period, request.month());
        Category category = resolveCategory(username, request.categoryId());

        rejectDuplicate(username, month, category, budget.getId());

        budget.setPeriod(period);
        budget.setMonth(month);
        budget.setAmount(request.amount());
        budget.setCurrency(request.currency().trim().toUpperCase());
        budget.setCategory(category);

        Budget saved = budgetRepo.save(budget);
        return toResponse(saved, spentFor(saved, LocalDate.now()));
    }

    @Transactional
    public void delete(String username, Long id) {
        Budget budget = budgetRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Budget not found"));
        budgetRepo.delete(budget);
    }

    /**
     * Spending counted against a budget: EXPENSE transactions only, in the budget's own
     * currency, within the budget period. Transfers are excluded, refunds (negative
     * expenses) reduce the total.
     */
    private BigDecimal spentFor(Budget budget, LocalDate reference) {
        LocalDate start;
        LocalDate end;
        if (budget.getPeriod() == BudgetPeriod.YEARLY) {
            int year = (budget.getMonth() != null && budget.getMonth().length() >= 4)
                    ? Integer.parseInt(budget.getMonth().substring(0, 4))
                    : reference.getYear();
            start = LocalDate.of(year, 1, 1);
            end = LocalDate.of(year, 12, 31);
        } else {
            YearMonth ym;
            try {
                ym = budget.getMonth() != null
                        ? YearMonth.parse(budget.getMonth())
                        : YearMonth.from(reference);
            } catch (Exception e) {
                ym = YearMonth.from(reference);
            }
            start = ym.atDay(1);
            end = ym.atEndOfMonth();
        }

        // A budget with a category tracks only that category's spending; a budget
        // without one tracks all spending in the period.
        BigDecimal total = budget.getCategory() != null
                ? transactionRepo.sumByTypeAndCategory(
                        budget.getUser().getUsername(), "EXPENSE", budget.getCurrency(), start, end,
                        budget.getCategory().getId())
                : transactionRepo.sumByType(
                        budget.getUser().getUsername(), "EXPENSE", budget.getCurrency(), start, end);
        return total == null ? BigDecimal.ZERO : total;
    }

    private String normalizeMonth(BudgetPeriod period, String month) {
        if (period == BudgetPeriod.YEARLY) {
            // Store the year as YYYY-01 so the column always holds a valid YYYY-MM value.
            if (month == null || month.isBlank()) {
                return YearMonth.now().getYear() + "-01";
            }
            String trimmed = month.trim();
            if (trimmed.length() >= 4) {
                return trimmed.substring(0, 4) + "-01";
            }
            throw ApiException.badRequest("Invalid year format in month: " + month);
        }
        if (month == null || month.isBlank()) {
            return YearMonth.now().toString();
        }
        String trimmed = month.trim();
        try {
            YearMonth.parse(trimmed);
        } catch (Exception e) {
            throw ApiException.badRequest("Month must be in YYYY-MM format: " + month);
        }
        return trimmed;
    }

    private Category resolveCategory(String username, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        Category category = categoryRepo.findByIdAndUserUsername(categoryId, username)
                .orElseThrow(() -> ApiException.badRequest("Category not found for this account"));
        if (!"EXPENSE".equalsIgnoreCase(category.getType())) {
            throw ApiException.badRequest("Budget category must be an EXPENSE category");
        }
        return category;
    }

    /**
     * The budgets table has a unique key on (user_id, month, category_id). Checking it
     * here turns a constraint violation into a 409 instead of an opaque 500.
     */
    private void rejectDuplicate(String username, String month, Category category, Long excludeId) {
        Long categoryId = category != null ? category.getId() : null;
        for (Budget existing : budgetRepo.findByUserUsernameAndMonth(username, month)) {
            Long existingCategoryId = existing.getCategory() != null ? existing.getCategory().getId() : null;
            boolean sameCategory = existingCategoryId == null
                    ? categoryId == null
                    : existingCategoryId.equals(categoryId);
            boolean isSelf = excludeId != null && excludeId.equals(existing.getId());
            if (sameCategory && !isSelf) {
                throw ApiException.conflict("A budget for that month and category already exists");
            }
        }
    }

    private BudgetResponse toResponse(Budget budget, BigDecimal spent) {
        BigDecimal amount = budget.getAmount();
        BigDecimal remaining = amount.subtract(spent);
        BigDecimal percentUsed = amount.signum() == 0
                ? BigDecimal.ZERO
                : spent.multiply(BigDecimal.valueOf(100)).divide(amount, 2, RoundingMode.HALF_UP);

        BudgetResponse.Status status;
        if (spent.compareTo(amount) > 0) {
            status = BudgetResponse.Status.OVER_BUDGET;
        } else if (percentUsed.compareTo(WARNING_THRESHOLD) >= 0) {
            status = BudgetResponse.Status.WARNING;
        } else {
            status = BudgetResponse.Status.ON_TRACK;
        }

        return new BudgetResponse(
                budget.getId(),
                budget.getCategory() != null ? budget.getCategory().getId() : null,
                budget.getCategory() != null ? budget.getCategory().getName() : null,
                budget.getPeriod().name(),
                budget.getMonth(),
                amount,
                budget.getCurrency(),
                spent,
                remaining,
                percentUsed,
                status.name());
    }
}
