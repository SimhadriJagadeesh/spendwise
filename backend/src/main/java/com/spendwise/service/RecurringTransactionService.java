package com.spendwise.service;

import com.spendwise.dto.RecurringTransactionRequest;
import com.spendwise.dto.RecurringTransactionResponse;
import com.spendwise.entity.Category;
import com.spendwise.entity.RecurrenceFrequency;
import com.spendwise.entity.RecurringTransaction;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.CategoryRepository;
import com.spendwise.repository.RecurringTransactionRepository;
import com.spendwise.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class RecurringTransactionService {
    private final RecurringTransactionRepository recurringRepo;
    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final RecurringDateCalculator dateCalculator;

    public RecurringTransactionService(RecurringTransactionRepository recurringRepo,
                                      CategoryRepository categoryRepo,
                                      UserRepository userRepo,
                                      RecurringDateCalculator dateCalculator) {
        this.recurringRepo = recurringRepo;
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
        this.dateCalculator = dateCalculator;
    }

    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> list(String username) {
        return recurringRepo.findByUserUsernameOrderByNextPaymentDateAsc(username).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> dueBetween(String username, LocalDate from, LocalDate to) {
        return recurringRepo
                .findByUserUsernameAndActiveTrueAndNextPaymentDateBetweenOrderByNextPaymentDateAsc(username, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecurringTransactionResponse getOne(String username, Long id) {
        return toResponse(recurringRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Recurring transaction not found")));
    }

    @Transactional
    public RecurringTransactionResponse create(String username, RecurringTransactionRequest request) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated user not found"));

        RecurringTransaction recurring = new RecurringTransaction();
        recurring.setUser(user);
        apply(recurring, request, username);
        return toResponse(save(recurring));
    }

    @Transactional
    public RecurringTransactionResponse update(String username, Long id, RecurringTransactionRequest request) {
        RecurringTransaction recurring = recurringRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Recurring transaction not found"));
        apply(recurring, request, username);
        return toResponse(save(recurring));
    }

    @Transactional
    public void delete(String username, Long id) {
        RecurringTransaction recurring = recurringRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Recurring transaction not found"));
        recurringRepo.delete(recurring);
    }

    /**
     * Advances the schedule by one interval and returns the new next-payment date.
     * The schedule itself is not turned into a transaction: creating real
     * transactions is a separate, explicit action.
     */
    @Transactional
    public RecurringTransactionResponse advance(String username, Long id) {
        RecurringTransaction recurring = recurringRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Recurring transaction not found"));

        if (!recurring.isActive()) {
            throw ApiException.conflict("Cannot advance an inactive recurring transaction");
        }

        int interval = recurring.getIntervalCount() == null ? 1 : recurring.getIntervalCount();
        LocalDate current = recurring.getNextPaymentDate() != null
                ? recurring.getNextPaymentDate()
                : LocalDate.now();
        recurring.setNextPaymentDate(
                dateCalculator.nextDate(current, recurring.getFrequency(), interval));

        return toResponse(save(recurring));
    }

    @Transactional
    public RecurringTransactionResponse setActive(String username, Long id, boolean active) {
        RecurringTransaction recurring = recurringRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Recurring transaction not found"));
        recurring.setActive(active);
        return toResponse(save(recurring));
    }

    private RecurringTransaction save(RecurringTransaction recurring) {
        return Objects.requireNonNull(recurringRepo.save(recurring), "save() returned null");
    }

    private void apply(RecurringTransaction recurring, RecurringTransactionRequest request, String username) {
        if (request.name() == null || request.name().isBlank()) {
            throw ApiException.badRequest("Name is required");
        }
        recurring.setName(request.name().trim());

        if (request.type() == null || request.type().isBlank()) {
            throw ApiException.badRequest("Type is required");
        }
        String upperType = request.type().trim().toUpperCase();
        if (!upperType.equals("INCOME") && !upperType.equals("EXPENSE")) {
            throw ApiException.badRequest("Type must be INCOME or EXPENSE");
        }
        recurring.setType(upperType);

        if (request.amount() == null || request.amount().signum() <= 0) {
            throw ApiException.badRequest("Amount must be greater than zero");
        }
        recurring.setAmount(request.amount());

        if (request.currency() == null || request.currency().isBlank()) {
            throw ApiException.badRequest("Currency is required");
        }
        recurring.setCurrency(request.currency().trim().toUpperCase());

        if (request.frequency() == null || request.frequency().isBlank()) {
            throw ApiException.badRequest("Frequency is required");
        }
        try {
            recurring.setFrequency(RecurrenceFrequency.valueOf(request.frequency().trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid frequency: " + request.frequency());
        }

        recurring.setIntervalCount(request.intervalCount() == null ? 1 : request.intervalCount());
        recurring.setNextPaymentDate(request.nextPaymentDate());

        Category category = resolveCategory(username, request.categoryId());
        if (category != null && !upperType.equalsIgnoreCase(category.getType())) {
            throw ApiException.badRequest("Category type must match recurring transaction type (" + upperType + ")");
        }
        recurring.setCategory(category);
    }

    private Category resolveCategory(String username, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepo.findByIdAndUserUsername(categoryId, username)
                .orElseThrow(() -> ApiException.badRequest("Category not found for this account"));
    }

    private RecurringTransactionResponse toResponse(RecurringTransaction recurring) {
        Category category = recurring.getCategory();
        RecurrenceFrequency frequency = recurring.getFrequency();
        return new RecurringTransactionResponse(
                recurring.getId(),
                recurring.getName(),
                recurring.getType(),
                recurring.getAmount(),
                recurring.getCurrency(),
                frequency == null ? null : frequency.name(),
                recurring.getIntervalCount(),
                recurring.getNextPaymentDate(),
                recurring.isActive(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null);
    }
}
