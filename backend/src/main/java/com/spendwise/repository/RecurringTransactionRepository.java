package com.spendwise.repository;

import com.spendwise.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByUserUsernameOrderByNextPaymentDateAsc(String username);
    List<RecurringTransaction> findByUserUsernameAndActiveTrueAndNextPaymentDateBetweenOrderByNextPaymentDateAsc(
            String username, LocalDate from, LocalDate to);
    Optional<RecurringTransaction> findByIdAndUserUsername(Long id, String username);
}
