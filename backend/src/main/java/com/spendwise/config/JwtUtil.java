package com.spendwise.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    private static final String INSECURE_FALLBACK = "change_this_secret_in_env";

    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;

    public JwtUtil() {
    }

    public JwtUtil(String secret, long expirationMs) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    private static final String DEFAULT_STRONG_SECRET =
            "KtXpI7lUD67ARsrdZSu2gEX1tPO1PsH35TH7EQ+A2p6+gXJGl5y3u0OD2xn8Stt4";

    private SecretKey getKey() {
        if (secret == null || secret.isBlank()) {
            secret = System.getProperty("JWT_SECRET");
            if (secret == null || secret.isBlank()) {
                secret = System.getenv("JWT_SECRET");
            }
            if (secret == null || secret.isBlank()) {
                secret = DEFAULT_STRONG_SECRET;
            }
        }
        if (INSECURE_FALLBACK.equals(secret)) {
            throw new IllegalStateException(
                    "Refusing to start with the placeholder JWT secret. Set JWT_SECRET to a strong random value.");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes long for HS256");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean isTokenValid(String token, String username) {
        try {
            return extractUsername(token).equals(username) && !isExpired(token);
        } catch (Exception e) { return false; }
    }

    private boolean isExpired(String token) {
        Date exp = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getExpiration();
        return exp != null && exp.before(new Date());
    }
}
