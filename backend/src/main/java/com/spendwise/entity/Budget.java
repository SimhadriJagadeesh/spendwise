package com.spendwise.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "budgets", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "`month`", "category_id"}))
public class Budget {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    /** MONTHLY or YEARLY, matching the existing budgets.period column. */
    @Enumerated(EnumType.STRING)
    @Column(name = "period", nullable = false, length = 20)
    private BudgetPeriod period = BudgetPeriod.MONTHLY;

    /** Budget month in YYYY-MM form. Required for MONTHLY budgets. */
    @Column(name = "`month`", length = 7)
    private String month;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User u) { this.user = u; }
    public Category getCategory() { return category; }
    public void setCategory(Category c) { this.category = c; }
    public BudgetPeriod getPeriod() { return period; }
    public void setPeriod(BudgetPeriod p) { this.period = p; }
    public String getMonth() { return month; }
    public void setMonth(String m) { this.month = m; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal a) { this.amount = a; }
    public String getCurrency() { return currency; }
    public void setCurrency(String c) { this.currency = c; }
}
