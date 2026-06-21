package com.elocampo.authservice.token.service;

import com.elocampo.authservice.config.token.TokenConfig;
import com.elocampo.authservice.exceptions.ValidationErrorException;
import com.elocampo.authservice.token.TokenInput;
import com.elocampo.authservice.user.entity.User;
import com.elocampo.authservice.user.repository.UserRepository;
import org.instancio.Instancio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.instancio.Select.field;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceImplTest {

    private static final String JWT_SECRET = "ThisIsAVeryLongSecretKeyUsedForJWTSigningInTests1234567890ABCDEF";
    private static final int EXPIRATION_DAYS = 3;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenConfig tokenConfig;

    @InjectMocks
    private TokenServiceImpl tokenService;

    private TokenInput validInput;
    private User existingUser;

    @BeforeEach
    void setUp() {

        validInput = new TokenInput("test@example.com", "password123");

        existingUser = Instancio.of(User.class)
                .set(field(User.class, "id"), UUID.randomUUID().toString())
                .set(field(User.class, "email"), "test@example.com")
                .set(field(User.class, "password"), "encodedPassword")
                .set(field(User.class, "admin"), false)
                .set(field(User.class, "removed"), false)
                .create();
    }

    @Test
    void generateShouldReturnTokenResponseWhenCredentialsAreValid() {

        when(tokenConfig.getJwtSecret()).thenReturn(JWT_SECRET);
        when(tokenConfig.getExpirationDays()).thenReturn(EXPIRATION_DAYS);
        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(validInput.getPassword(), existingUser.getPassword())).thenReturn(true);

        var result = tokenService.generate(validInput);

        assertThat(result).isNotNull();
        assertThat(result.token()).isNotBlank();
    }

    @Test
    void generateShouldThrowValidationErrorExceptionWhenUserNotFound() {

        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.generate(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void generateShouldThrowValidationErrorExceptionWhenPasswordDoesNotMatch() {

        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(validInput.getPassword(), existingUser.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> tokenService.generate(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void validateShouldReturnTrueWhenTokenIsValid() {

        when(tokenConfig.getJwtSecret()).thenReturn(JWT_SECRET);
        when(tokenConfig.getExpirationDays()).thenReturn(EXPIRATION_DAYS);
        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(validInput.getPassword(), existingUser.getPassword())).thenReturn(true);

        var tokenResponse = tokenService.generate(validInput);
        var result = tokenService.validate(tokenResponse.token());

        assertThat(result.valid()).isTrue();
    }

    @Test
    void validateShouldReturnFalseWhenTokenIsMalformed() {

        when(tokenConfig.getJwtSecret()).thenReturn(JWT_SECRET);

        var result = tokenService.validate("this.is.not.a.valid.jwt");

        assertThat(result.valid()).isFalse();
    }

    @Test
    void validateShouldReturnFalseWhenTokenIsSignedWithDifferentSecret() {

        when(tokenConfig.getJwtSecret()).thenReturn(JWT_SECRET);

        var fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.wrongsignature";

        var result = tokenService.validate(fakeToken);

        assertThat(result.valid()).isFalse();
    }

    @Test
    void validateShouldReturnFalseWhenTokenIsEmpty() {

        when(tokenConfig.getJwtSecret()).thenReturn(JWT_SECRET);

        var result = tokenService.validate("");

        assertThat(result.valid()).isFalse();
    }
}
