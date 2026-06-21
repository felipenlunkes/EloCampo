package com.elocampo.accountservice.account.controller;

import com.elocampo.accountservice.account.AccountInput;
import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.accountservice.account.service.AccountService;
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
class AccountControllerTest {

    @Mock
    private AccountService accountService;

    @InjectMocks
    private AccountController accountController;

    private UUID accountId;
    private UUID userId;
    private AccountResponse accountResponse;
    private AccountInput accountInput;

    @BeforeEach
    void setUp() {

        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();

        accountResponse = new AccountResponse();
        accountResponse.setId(accountId);
        accountResponse.setUserId(userId);
        accountResponse.setName("João Silva");
        accountResponse.setRole(AccountRole.BUYER);

        accountInput = new AccountInput();
        accountInput.setUserId(userId);
        accountInput.setName("João Silva");
    }

    @Test
    void createShouldReturn201WithBody() {
        when(accountService.create(accountInput)).thenReturn(accountResponse);

        var response = accountController.create(accountInput);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(accountResponse);
    }

    @Test
    void findByIdShouldReturnAccount() {

        when(accountService.findById(accountId)).thenReturn(Optional.of(accountResponse));

        var response = accountController.findById(accountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(accountResponse);
    }

    @Test
    void findByIdShouldFailWhenAccountNotFound() {

        when(accountService.findById(accountId)).thenReturn(Optional.empty());

        var response = accountController.findById(accountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void shouldUpdateAccount() {

        when(accountService.update(accountId, accountInput)).thenReturn(accountResponse);

        var response = accountController.update(accountId, accountInput);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(accountResponse);
    }

    @Test
    void findByUserIdShouldReturnUserWhenUserExists() {

        when(accountService.findByUserId(userId)).thenReturn(Optional.of(accountResponse));

        var response = accountController.findByUserId(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(accountResponse);
    }

    @Test
    void findByUserIdShouldFailWhenUserNotExists() {

        when(accountService.findByUserId(userId)).thenReturn(Optional.empty());

        var response = accountController.findByUserId(userId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void shouldDeactivateAccount4() {

        doNothing().when(accountService).deactivate(accountId);

        var response = accountController.deactivate(accountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(accountService).deactivate(accountId);
    }

    @Test
    void shouldActivateAccount() {

        doNothing().when(accountService).activate(accountId);

        var response = accountController.activate(accountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(accountService).activate(accountId);
    }
}
