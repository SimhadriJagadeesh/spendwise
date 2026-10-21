package com.spendwise.repository;

import com.spendwise.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByUserUsernameOrderByCreatedAtDesc(String username);
    Optional<SavingsGoal> findByIdAndUserUsername(Long id, String username);
}
