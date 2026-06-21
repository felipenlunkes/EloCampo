package com.elocampo.authservice.token.service;

import com.elocampo.authservice.config.token.TokenConfig;
import com.elocampo.authservice.exceptions.ValidationErrorException;
import com.elocampo.authservice.token.TokenInput;
import com.elocampo.authservice.token.TokenResponse;
import com.elocampo.authservice.token.TokenValidationResponse;
import com.elocampo.authservice.user.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@Slf4j
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenConfig tokenConfig;

    @Override
    public TokenResponse generate(TokenInput request) {

        var user = userRepository.findByEmailAndRemovedFalse(request.getEmail())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
                .orElseThrow(() -> new ValidationErrorException("Invalid credentials"));

        var key = Keys.hmacShaKeyFor(tokenConfig.getJwtSecret().getBytes(StandardCharsets.UTF_8));

        var token = Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("isAdmin", user.isAdmin())
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(tokenConfig.getExpirationDays(), ChronoUnit.DAYS)))
                .signWith(key)
                .compact();

        log.info("Token generated for user (userId={})", user.getId());

        return new TokenResponse(token);
    }

    @Override
    public TokenValidationResponse validate(String token) {

        try {
            var key = Keys.hmacShaKeyFor(tokenConfig.getJwtSecret().getBytes(StandardCharsets.UTF_8));
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return new TokenValidationResponse(true);
        } catch (JwtException | IllegalArgumentException e) {
            return new TokenValidationResponse(false);
        }
    }
}
