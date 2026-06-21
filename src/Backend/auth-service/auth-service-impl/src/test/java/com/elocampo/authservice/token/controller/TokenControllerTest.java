package com.elocampo.authservice.token.controller;

import com.elocampo.authservice.token.TokenInput;
import com.elocampo.authservice.token.TokenResponse;
import com.elocampo.authservice.token.TokenValidationResponse;
import com.elocampo.authservice.token.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenControllerTest {

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private TokenController tokenController;

    private TokenInput tokenInput;
    private TokenResponse tokenResponse;

    @BeforeEach
    void setUp() {

        tokenInput = new TokenInput("test@example.com", "password123");
        tokenResponse = new TokenResponse("eyJhbGciOiJIUzI1NiJ9.sample.token");
    }

    @Test
    void generateShouldReturn200WithToken() {

        when(tokenService.generate(tokenInput)).thenReturn(tokenResponse);

        var response = tokenController.generate(tokenInput);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(tokenResponse);
        assertThat(response.getBody().token()).isNotBlank();
    }

    @Test
    void validateShouldReturn200WithTrueWhenTokenIsValid() {

        when(tokenService.validate("validToken")).thenReturn(new TokenValidationResponse(true));

        var response = tokenController.validate("validToken");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().valid()).isTrue();
    }

    @Test
    void validateShouldReturn200WithFalseWhenTokenIsInvalid() {

        when(tokenService.validate("invalidToken")).thenReturn(new TokenValidationResponse(false));

        var response = tokenController.validate("invalidToken");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().valid()).isFalse();
    }
}
