package com.spendwise.repository;

import com.spendwise.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    /**
     * The users table uses a case-insensitive collation, so "Mira" and "mira" are
     * the same key as far as the database is concerned. The uniqueness checks have
     * to match that, or the insert is rejected by the database and surfaces as a
     * 500 instead of a 409.
     */
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    long countByEnabledTrue();
}
