package com.spendwise;

import com.spendwise.config.JwtUtil;
import com.spendwise.entity.User;
import com.spendwise.repository.UserRepository;
import com.spendwise.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class BackendApplicationTests {

    private static final String SECRET = "test-secret-min-32-characters-long-xxxxxxxx";

    private BCryptPasswordEncoder passwordEncoder;
    private Map<String, User> byUsername;
    private Map<String, User> byEmail;
    private AuthService authService;
    private JwtUtil jwtUtil;

    /**
     * In-memory stand-in for the Spring Data repository. A JDK proxy is used so the stub
     * does not have to implement every JpaRepository method by hand.
     */
    private UserRepository stubRepository() {
        byUsername = new HashMap<>();
        byEmail = new HashMap<>();
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByUsername" -> Optional.ofNullable(byUsername.get(args[0]));
                    case "findByEmail" -> Optional.ofNullable(byEmail.get(args[0]));
                    case "existsByUsername" -> byUsername.containsKey(args[0]);
                    case "existsByEmail" -> byEmail.containsKey(args[0]);
                    case "existsByUsernameIgnoreCase" -> byUsername.keySet().stream()
                            .anyMatch(k -> k.equalsIgnoreCase((String) args[0]));
                    case "existsByEmailIgnoreCase" -> byEmail.keySet().stream()
                            .anyMatch(k -> k.equalsIgnoreCase((String) args[0]));
                    case "save" -> {
                        User u = (User) args[0];
                        byUsername.put(u.getUsername(), u);
                        byEmail.put(u.getEmail(), u);
                        yield u;
                    }
                    case "toString" -> "StubUserRepository";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> throw new UnsupportedOperationException(
                            "Not used in these tests: " + method.getName());
                });
    }

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        jwtUtil = new JwtUtil(SECRET, 3_600_000L);
        authService = new AuthService(stubRepository(), jwtUtil, passwordEncoder);
    }

    @Test
    void registerHashesPasswordAndForcesUserRole() {
        User registered = authService.register("mira", "mira@example.com", "correct-horse-battery");

        assertEquals("mira", registered.getUsername());
        assertEquals("mira@example.com", registered.getEmail());
        assertNotEquals("correct-horse-battery", registered.getPasswordHash());
        assertTrue(passwordEncoder.matches("correct-horse-battery", registered.getPasswordHash()));
        assertEquals("USER", registered.getRole());
        assertTrue(registered.isEnabled());
    }

    @Test
    void registerRejectsDuplicateUsername() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register("mira", "other@example.com", "another-password"));
        assertEquals("That username is already taken", ex.getMessage());
    }

    @Test
    void registerRejectsDuplicateEmail() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register("other", "mira@example.com", "another-password"));
        assertEquals("An account with that email already exists", ex.getMessage());
    }

    @Test
    void registerRejectsAUsernameThatDiffersOnlyInCase() {
        // The unique keys use a case-insensitive collation, so "Mira" is taken
        // once "mira" is.
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register("Mira", "other@example.com", "another-password"));
        assertEquals("That username is already taken", ex.getMessage());
    }

    @Test
    void registerRejectsAnEmailThatDiffersOnlyInCase() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.register("other", "Mira@Example.com", "another-password"));
        assertEquals("An account with that email already exists", ex.getMessage());
    }

    @Test
    void loginReturnsTokenForValidCredentials() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        String token = authService.login("mira", "correct-horse-battery");

        assertNotNull(token);
        assertTrue(token.contains("."));
        assertEquals("mira", jwtUtil.extractUsername(token));
    }

    @Test
    void loginAcceptsEmailAsIdentifier() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        String token = authService.login("mira@example.com", "correct-horse-battery");

        assertEquals("mira", jwtUtil.extractUsername(token));
    }

    @Test
    void loginRejectsInvalidPassword() {
        authService.register("mira", "mira@example.com", "correct-horse-battery");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.login("mira", "wrong-password"));
        assertEquals("Invalid username or password", ex.getMessage());
    }

    @Test
    void loginRejectsUnknownUserWithSameMessageAsWrongPassword() {
        RuntimeException unknownUser = assertThrows(RuntimeException.class,
                () -> authService.login("nobody", "some-password"));

        authService.register("mira", "mira@example.com", "correct-horse-battery");
        RuntimeException wrongPassword = assertThrows(RuntimeException.class,
                () -> authService.login("mira", "wrong-password"));

        // Identical message so the response does not disclose whether the account exists.
        assertEquals(unknownUser.getMessage(), wrongPassword.getMessage());
    }
}
