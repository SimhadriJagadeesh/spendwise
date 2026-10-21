package com.spendwise.repository;

import com.spendwise.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserUsername(String username);
    Optional<Budget> findByIdAndUserUsername(Long id, String username);
    List<Budget> findByUserUsernameAndMonth(String username, String month);
}
