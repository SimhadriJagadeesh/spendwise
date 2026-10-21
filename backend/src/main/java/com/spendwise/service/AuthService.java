package com.spendwise.service;

import com.spendwise.config.JwtUtil;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final com.spendwise.config.DataInitializer dataInitializer;

    public AuthService(UserRepository userRepo, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this(userRepo, jwtUtil, passwordEncoder, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(UserRepository userRepo, JwtUtil jwtUtil, PasswordEncoder passwordEncoder,
                       com.spendwise.config.DataInitializer dataInitializer) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.dataInitializer = dataInitializer;
    }

    @Transactional
    public User register(String username, String email, String plainPassword) {
        // The unique keys on users are case-insensitive, so the duplicate checks
        // have to be too - otherwise the insert fails at the database and the
        // caller gets a 500 instead of a 409.
        if (userRepo.existsByUsernameIgnoreCase(username)) {
            throw ApiException.conflict("That username is already taken");
        }
        if (userRepo.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with that email already exists");
        }
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(plainPassword));
        // Role is never taken from client input - admin must be provisioned out of band.
        u.setRole("USER");
        u.setEnabled(true);
        User saved = userRepo.save(u);
        if (dataInitializer != null) {
            dataInitializer.seedDefaultCategories(saved);
        }
        return saved;
    }

    public String login(String usernameOrEmail, String plainPassword) {
        User u = userRepo.findByUsername(usernameOrEmail).orElse(null);
        if (u == null) {
            u = userRepo.findByEmail(usernameOrEmail).orElse(null);
        }
        // Do not disclose whether the account exists.
        if (u == null || !passwordEncoder.matches(plainPassword, u.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid username or password");
        }
        if (!u.isEnabled()) {
            throw ApiException.unauthorized("Invalid username or password");
        }
        return jwtUtil.generateToken(u.getUsername());
    }
}
