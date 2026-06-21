package com.elocampo.authservice.user.controller;

import com.elocampo.authservice.user.UserInput;
import com.elocampo.authservice.user.UserResponse;
import com.elocampo.authservice.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private UUID userId;
    private UserResponse userResponse;
    private UserInput userInput;

    @BeforeEach
    void setUp() {

        userId = UUID.randomUUID();

        userResponse = new UserResponse(userId, "test@example.com", false, 1000L, 1000L);

        userInput = new UserInput("test@example.com", "password123", false);
    }

    @Test
    void createShouldReturn201WithBody() {

        when(userService.create(userInput)).thenReturn(userResponse);

        var response = userController.create(userInput);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(userResponse);
    }

    @Test
    void findByIdShouldReturn200WhenUserExists() {

        when(userService.findById(userId)).thenReturn(Optional.of(userResponse));

        var response = userController.findById(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(userResponse);
    }

    @Test
    void findByIdShouldReturn404WhenUserNotFound() {

        when(userService.findById(userId)).thenReturn(Optional.empty());

        var response = userController.findById(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void findByEmailShouldReturn200WhenUserExists() {

        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(userResponse));

        var response = userController.findByEmail("test@example.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(userResponse);
    }

    @Test
    void findByEmailShouldReturn404WhenUserNotFound() {

        when(userService.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        var response = userController.findByEmail("unknown@example.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void deactivateShouldReturn204WhenUserExists() {

        doNothing().when(userService).deactivate(userId);

        var response = userController.deactivate(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(userService).deactivate(userId);
    }

    @Test
    void activateShouldReturn204WhenUserExists() {

        doNothing().when(userService).activate(userId);

        var response = userController.activate(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(userService).activate(userId);
    }

    @Test
    void resetPasswordShouldReturn204WhenUserExists() {

        doNothing().when(userService).resetPassword("test@example.com");

        var response = userController.resetPassword("test@example.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(userService).resetPassword("test@example.com");
    }
}
