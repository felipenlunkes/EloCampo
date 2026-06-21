package com.elocampo.authservice.user.service;

import com.elocampo.authservice.config.client.MessageServiceClient;
import com.elocampo.authservice.exceptions.NotFoundException;
import com.elocampo.authservice.exceptions.ValidationErrorException;
import com.elocampo.authservice.user.UserInput;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MessageServiceClient messageServiceClient;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID userId;
    private UserInput validInput;
    private User existingUser;

    @BeforeEach
    void setUp() {

        userId = UUID.randomUUID();

        validInput = new UserInput("test@example.com", "password123", false);

        existingUser = Instancio.of(User.class)
                .set(field(User.class, "id"), userId.toString())
                .set(field(User.class, "email"), "test@example.com")
                .set(field(User.class, "password"), "encodedPassword")
                .set(field(User.class, "admin"), false)
                .set(field(User.class, "removed"), false)
                .create();
    }

    @Test
    void createShouldReturnUserResponseWhenEmailDoesNotExist() {

        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(validInput.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        var result = userService.create(validInput);

        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo("test@example.com");
        assertThat(result.isAdmin()).isFalse();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createShouldThrowValidationErrorExceptionWhenEmailAlreadyExists() {

        when(userRepository.findByEmailAndRemovedFalse(validInput.getEmail())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> userService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("An user with this email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void findByIdShouldReturnUserResponseWhenUserExists() {

        when(userRepository.findByIdAndRemovedFalse(userId.toString())).thenReturn(Optional.of(existingUser));

        var result = userService.findById(userId);

        assertThat(result).isPresent();
        assertThat(result.get().email()).isEqualTo("test@example.com");
    }

    @Test
    void findByIdShouldReturnEmptyWhenUserNotFound() {

        when(userRepository.findByIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());

        var result = userService.findById(userId);

        assertThat(result).isEmpty();
    }

    @Test
    void findByEmailShouldReturnUserResponseWhenUserExists() {

        when(userRepository.findByEmailAndRemovedFalse("test@example.com")).thenReturn(Optional.of(existingUser));

        var result = userService.findByEmail("test@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().email()).isEqualTo("test@example.com");
    }

    @Test
    void findByEmailShouldReturnEmptyWhenUserNotFound() {

        when(userRepository.findByEmailAndRemovedFalse("unknown@example.com")).thenReturn(Optional.empty());

        var result = userService.findByEmail("unknown@example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void deactivateShouldSetRemovedTrueWhenUserExists() {

        when(userRepository.findByIdAndRemovedFalse(userId.toString())).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        assertThatNoException().isThrownBy(() -> userService.deactivate(userId));

        assertThat(existingUser.isRemoved()).isTrue();
        verify(userRepository).save(existingUser);
    }

    @Test
    void deactivateShouldThrowNotFoundExceptionWhenUserNotFound() {

        when(userRepository.findByIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deactivate(userId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void activateShouldSetRemovedFalseWhenUserIsDeactivated() {

        existingUser.setRemoved(true);
        when(userRepository.findById(userId.toString())).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        assertThatNoException().isThrownBy(() -> userService.activate(userId));

        assertThat(existingUser.isRemoved()).isFalse();
        verify(userRepository).save(existingUser);
    }

    @Test
    void activateShouldThrowNotFoundExceptionWhenUserNotFound() {

        when(userRepository.findById(userId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.activate(userId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void activateShouldThrowValidationErrorExceptionWhenUserIsAlreadyActive() {

        existingUser.setRemoved(false);
        when(userRepository.findById(userId.toString())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> userService.activate(userId))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("user already active");
    }

    @Test
    void resetPasswordShouldUpdatePasswordAndSendEmailWhenUserExists() {

        when(userRepository.findByEmailAndRemovedFalse("test@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode(anyString())).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        doNothing().when(messageServiceClient).send(any());

        assertThatNoException().isThrownBy(() -> userService.resetPassword("test@example.com"));

        verify(passwordEncoder).encode(anyString());
        verify(userRepository).save(existingUser);
        verify(messageServiceClient).send(any());
        assertThat(existingUser.getPassword()).isEqualTo("newEncodedPassword");
    }

    @Test
    void resetPasswordShouldThrowNotFoundExceptionWhenUserNotFound() {

        when(userRepository.findByEmailAndRemovedFalse("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.resetPassword("unknown@example.com"))
                .isInstanceOf(NotFoundException.class);
    }
}
