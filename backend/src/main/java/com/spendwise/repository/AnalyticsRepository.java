package com.spendwise.repository;

import com.spendwise.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Transaction, Long> {

    @Query("""
            select year(t.transactionDate),
                   month(t.transactionDate),
                   coalesce(sum(case when t.type = 'INCOME' then t.amount else 0 end), 0) as income,
                   coalesce(sum(case when t.type = 'EXPENSE' then t.amount else 0 end), 0) as expenses
            from Transaction t
            where t.user.username = :username
              and (:currency is null or t.currency = :currency)
              and t.transactionDate >= :fromDate
              and t.transactionDate <= :toDate
            group by year(t.transactionDate), month(t.transactionDate)
            order by year(t.transactionDate) asc, month(t.transactionDate) asc
            """)
    List<Object[]> cashFlowByMonth(@Param("username") String username,
                                   @Param("currency") String currency,
                                   @Param("fromDate") LocalDate fromDate,
                                   @Param("toDate") LocalDate toDate);

    @Query("""
            select coalesce(c.name, 'Uncategorised') as category,
                   coalesce(sum(t.amount), 0) as total
            from Transaction t
            left join t.category c
            where t.user.username = :username
              and t.type = 'EXPENSE'
              and (:currency is null or t.currency = :currency)
              and t.transactionDate >= :fromDate
              and t.transactionDate <= :toDate
            group by coalesce(c.name, 'Uncategorised')
            order by sum(t.amount) desc
            """)
    List<Object[]> spendingByCategory(@Param("username") String username,
                                      @Param("currency") String currency,
                                      @Param("fromDate") LocalDate fromDate,
                                      @Param("toDate") LocalDate toDate);
}
