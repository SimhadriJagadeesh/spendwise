package com.spendwise.config;

import com.spendwise.entity.User;
import com.spendwise.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest req,
            @NonNull HttpServletResponse res,
            @NonNull FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            // A malformed or tampered token must not produce a 500: treat it as "no credentials"
            // and let the authorization rules decide (401 for protected paths).
            try {
                String token = header.substring(7);
                String username = jwtUtil.extractUsername(token);
                if (username != null && jwtUtil.isTokenValid(token, username)) {
                    User user = userRepository.findByUsername(username).orElse(null);
                    if (user != null && user.isEnabled()) {
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + user.getRole()));
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            } catch (RuntimeException ignored) {
                // Invalid signature, expired token, malformed payload - continue unauthenticated.
            }
        }
        chain.doFilter(req, res);
    }
}
