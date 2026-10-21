package com.spendwise.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    @Column(nullable = false, length = 20) private String type; // INCOME, EXPENSE, TRANSFER
    @Column(length = 255) private String description;
    @Column(length = 255) private String merchant;
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;
    @Column(nullable = false, length = 3) private String currency = "USD";
    @Column(name = "transaction_date", nullable = false) private LocalDate transactionDate;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(length = 255) private String tags;
    @Column(nullable = false) private boolean reviewed = false;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at") private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // getters/setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public User getUser() { return user; } public void setUser(User user) { this.user = user; }
    public Category getCategory() { return category; } public void setCategory(Category c) { this.category = c; }
    public String getType() { return type; } public void setType(String type) { this.type = type; }
    public String getDescription() { return description; } public void setDescription(String d) { this.description = d; }
    public String getMerchant() { return merchant; } public void setMerchant(String m) { this.merchant = m; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal a) { this.amount = a; }
    public String getCurrency() { return currency; } public void setCurrency(String c) { this.currency = c; }
    public LocalDate getTransactionDate() { return transactionDate; } public void setTransactionDate(LocalDate d) { this.transactionDate = d; }
    public String getNotes() { return notes; } public void setNotes(String n) { this.notes = n; }
    public String getTags() { return tags; } public void setTags(String t) { this.tags = t; }
    public boolean isReviewed() { return reviewed; } public void setReviewed(boolean r) { this.reviewed = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(LocalDateTime t) { this.updatedAt = t; }
}
