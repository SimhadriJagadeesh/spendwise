package com.spendwise.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_transactions")
public class RecurringTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 20)
    private String type; // INCOME or EXPENSE

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    private RecurrenceFrequency frequency = RecurrenceFrequency.MONTHLY;

    @Column(name = "interval_count", nullable = false)
    private Integer intervalCount = 1;

    @Column(name = "next_payment_date", nullable = false)
    private LocalDate nextPaymentDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User u) { this.user = u; }
    public Category getCategory() { return category; }
    public void setCategory(Category c) { this.category = c; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public String getType() { return type; }
    public void setType(String t) { this.type = t; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal a) { this.amount = a; }
    public String getCurrency() { return currency; }
    public void setCurrency(String c) { this.currency = c; }
    public RecurrenceFrequency getFrequency() { return frequency; }
    public void setFrequency(RecurrenceFrequency f) { this.frequency = f; }
    public Integer getIntervalCount() { return intervalCount; }
    public void setIntervalCount(Integer i) { this.intervalCount = i; }
    public LocalDate getNextPaymentDate() { return nextPaymentDate; }
    public void setNextPaymentDate(LocalDate d) { this.nextPaymentDate = d; }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
