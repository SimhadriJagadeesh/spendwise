package com.spendwise.service;

import com.spendwise.dto.TransactionRequest;
import com.spendwise.dto.TransactionResponse;
import com.spendwise.entity.Category;
import com.spendwise.entity.Transaction;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.CategoryRepository;
import com.spendwise.repository.TransactionRepository;
import com.spendwise.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepo;
    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;

    public TransactionService(TransactionRepository transactionRepo,
                              CategoryRepository categoryRepo,
                              UserRepository userRepo) {
        this.transactionRepo = transactionRepo;
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
    }

    /**
     * Maps to the response DTO inside the transaction, so the lazy category
     * association is initialised while the session is still open.
     */
    @Transactional(readOnly = true)
    public Page<TransactionResponse> search(String username, String type, String currency, LocalDate from, LocalDate to,
                                           String search, Pageable pageable) {
        return transactionRepo.search(username, normalizeType(type), normalizeCurrency(currency), from, to,
                (search == null || search.isBlank()) ? null : search.trim(), pageable)
                .map(TransactionResponse::of);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getOne(String username, Long id) {
        Transaction tx = transactionRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        return TransactionResponse.of(tx);
    }

    /**
     * The rows for the CSV export, mapped inside the transaction for the same
     * reason as {@link #search}.
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> exportRows(String username, String currency, LocalDate from, LocalDate to) {
        return transactionRepo.findForExport(username, currency, from, to).stream()
                .map(TransactionResponse::of)
                .toList();
    }

    @Transactional
    public TransactionResponse create(String username, TransactionRequest request) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated user not found"));

        Transaction tx = new Transaction();
        tx.setUser(user);
        apply(tx, request, username);
        return TransactionResponse.of(transactionRepo.save(tx));
    }

    @Transactional
    public TransactionResponse update(String username, Long id, TransactionRequest request) {
        Transaction tx = transactionRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        apply(tx, request, username);
        return TransactionResponse.of(transactionRepo.save(tx));
    }

    @Transactional
    public void delete(String username, Long id) {
        Transaction tx = transactionRepo.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        transactionRepo.delete(tx);
    }

    private void apply(Transaction tx, TransactionRequest request, String username) {
        if (request.type() == null || request.type().isBlank()) {
            throw ApiException.badRequest("Type is required");
        }
        String upperType = request.type().trim().toUpperCase();
        if (!upperType.equals("INCOME") && !upperType.equals("EXPENSE") && !upperType.equals("TRANSFER")) {
            throw ApiException.badRequest("Type must be INCOME, EXPENSE or TRANSFER");
        }
        tx.setType(upperType);

        if (request.amount() == null || request.amount().signum() <= 0) {
            throw ApiException.badRequest("Amount must be greater than zero");
        }
        tx.setAmount(request.amount());

        if (request.currency() == null || request.currency().isBlank()) {
            throw ApiException.badRequest("Currency is required");
        }
        tx.setCurrency(request.currency().trim().toUpperCase());

        if (request.transactionDate() == null) {
            throw ApiException.badRequest("Date is required");
        }
        tx.setTransactionDate(request.transactionDate());

        tx.setDescription(request.description());
        tx.setMerchant(request.merchant());
        tx.setNotes(request.notes());
        tx.setTags(request.tags());

        Category category = resolveCategory(username, request.categoryId());
        if (category != null && !upperType.equals("TRANSFER") && !upperType.equalsIgnoreCase(category.getType())) {
            throw ApiException.badRequest("Category type must match transaction type (" + upperType + ")");
        }
        tx.setCategory(category);
    }

    private Category resolveCategory(String username, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepo.findByIdAndUserUsername(categoryId, username)
                .orElseThrow(() -> ApiException.badRequest("Category not found for this account"));
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        return type.trim().toUpperCase();
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return null;
        }
        return currency.trim().toUpperCase();
    }
}
