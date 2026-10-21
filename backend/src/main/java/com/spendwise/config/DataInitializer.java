package com.spendwise.config;

import com.spendwise.entity.Category;
import com.spendwise.entity.User;
import com.spendwise.repository.CategoryRepository;
import com.spendwise.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initAdmin();
    }

    private void initAdmin() {
        String adminEmail = "sunnyroks@gmail.com";
        String adminUsername = "sunnyroks";
        String adminPass = "sunny@28065";

        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            admin = userRepository.findByUsername(adminUsername).orElse(null);
        }

        if (admin == null) {
            admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPass));
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            admin = userRepository.save(admin);
            seedDefaultCategories(admin);
            log.info("Permanent Admin account initialized: {}", adminEmail);
        } else {
            admin.setRole("ADMIN");
            admin.setPasswordHash(passwordEncoder.encode(adminPass));
            admin.setEnabled(true);
            userRepository.save(admin);
            seedDefaultCategories(admin);
            log.info("Permanent Admin account updated and verified: {}", adminEmail);
        }
    }

    public void seedDefaultCategories(User user) {
        if (!categoryRepository.findByUserUsernameOrderByNameAsc(user.getUsername()).isEmpty()) {
            return;
        }

        List<String[]> defaults = List.of(
            new String[]{"Groceries 🛒", "EXPENSE", "#10B981"},
            new String[]{"Shopping 🛍️", "EXPENSE", "#EC4899"},
            new String[]{"Dining & Food 🍔", "EXPENSE", "#F59E0B"},
            new String[]{"Transportation 🚗", "EXPENSE", "#3B82F6"},
            new String[]{"Bills & Utilities ⚡", "EXPENSE", "#EF4444"},
            new String[]{"Housing & Rent 🏠", "EXPENSE", "#6366F1"},
            new String[]{"Entertainment 🎬", "EXPENSE", "#8B5CF6"},
            new String[]{"Healthcare 💊", "EXPENSE", "#14B8A6"},
            new String[]{"Travel ✈️", "EXPENSE", "#06B6D4"},
            new String[]{"Education 📚", "EXPENSE", "#F97316"},
            new String[]{"Personal Care 💈", "EXPENSE", "#A855F7"},
            new String[]{"Salary 💼", "INCOME", "#059669"},
            new String[]{"Freelance 💻", "INCOME", "#0284C7"},
            new String[]{"Investments 📈", "INCOME", "#10B981"},
            new String[]{"Gifts 🎁", "INCOME", "#D946EF"}
        );

        for (String[] def : defaults) {
            Category cat = new Category();
            cat.setUser(user);
            cat.setName(def[0]);
            cat.setType(def[1]);
            cat.setColor(def[2]);
            categoryRepository.save(cat);
        }
        log.info("Default categories seeded for user {}", user.getUsername());
    }
}
