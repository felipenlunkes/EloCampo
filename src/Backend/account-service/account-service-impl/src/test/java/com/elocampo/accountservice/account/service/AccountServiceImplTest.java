package com.elocampo.accountservice.account.service;

import com.elocampo.accountservice.account.AccountAddressInput;
import com.elocampo.accountservice.account.AccountInput;
import com.elocampo.accountservice.account.AccountPhoneInput;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.accountservice.account.entity.Account;
import com.elocampo.accountservice.account.entity.AccountAddress;
import com.elocampo.accountservice.account.entity.AccountPhone;
import com.elocampo.accountservice.account.repository.AccountRepository;
import com.elocampo.accountservice.config.client.AuthServiceClient;
import com.elocampo.accountservice.config.client.MessageServiceClient;
import com.elocampo.accountservice.exceptions.NotFoundException;
import com.elocampo.authservice.user.UserResponse;
import com.elocampo.accountservice.exceptions.ValidationErrorException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AuthServiceClient authServiceClient;

    @Mock
    private MessageServiceClient messageServiceClient;

    @InjectMocks
    private AccountServiceImpl accountService;

    private UUID accountId;
    private UUID userId;
    private AccountInput validInput;
    private Account existingAccount;

    @BeforeEach
    void setUp() {

        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();

        var addressInput = new AccountAddressInput();
        addressInput.setStreet("Rua das Flores");
        addressInput.setNumber("123");
        addressInput.setCity("São Paulo");
        addressInput.setDistrict("Centro");
        addressInput.setState("SP");
        addressInput.setComplement("Apto 1");
        addressInput.setPostalCode("01001-000");

        var phoneInput = new AccountPhoneInput();
        phoneInput.setCountryCode(55);
        phoneInput.setStateCode(11);
        phoneInput.setNumber("999999999");

        validInput = new AccountInput();
        validInput.setUserId(userId);
        validInput.setName("João Silva");
        validInput.setCpf("123.456.789-00");
        validInput.setBirthdayDate(Instant.now().toEpochMilli());
        validInput.setAddress(addressInput);
        validInput.setPhone(phoneInput);
        validInput.setRole(AccountRole.BUYER);

        var address = new AccountAddress();
        address.setStreet("Rua das Flores");
        address.setNumber("123");
        address.setCity("São Paulo");
        address.setDistrict("Centro");
        address.setState("SP");
        address.setComplement("Apto 1");
        address.setPostalCode("01001-000");

        var phone = new AccountPhone();
        phone.setCountryCode(55);
        phone.setStateCode(11);
        phone.setNumber("999999999");

        existingAccount = Account.builder()
                .id(accountId.toString())
                .userId(userId.toString())
                .name("João Silva")
                .cpf("123.456.789-00")
                .birthdayDate(Instant.now())
                .address(address)
                .phone(phone)
                .role(AccountRole.BUYER)
                .active(true)
                .removed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void createWithCpfSavesAndReturnsResponse() {

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());
        when(accountRepository.findByCpfAndRemovedFalse(validInput.getCpf())).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);
        when(authServiceClient.findUserById(userId)).thenReturn(new UserResponse(userId, "joao@example.com", false, 0L, 0L));

        var result = accountService.create(validInput);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("João Silva");
        verify(accountRepository).save(any(Account.class));
        verify(authServiceClient).findUserById(userId);
    }

    @Test
    void createWithCnpjSavesAndReturnsResponse() {

        validInput.setCpf(null);
        validInput.setCnpj("12.345.678/0001-90");

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());
        when(accountRepository.findByCnpjAndRemovedFalse(validInput.getCnpj())).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);
        when(authServiceClient.findUserById(userId)).thenReturn(new UserResponse(userId, "joao@example.com", false, 0L, 0L));

        var result = accountService.create(validInput);

        assertThat(result).isNotNull();
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void createWithoutCpfAndCnpjThrowsValidationErrorException() {

        validInput.setCpf(null);
        validInput.setCnpj(null);

        assertThatThrownBy(() -> accountService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("cpf or cnpj is required");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void createWithBothCpfAndCnpjThrowsValidationErrorException() {

        validInput.setCpf("123.456.789-00");
        validInput.setCnpj("12.345.678/0001-90");

        assertThatThrownBy(() -> accountService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("cpf and cnpj are mutually exclusive");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void createWhenUserAlreadyHasAccountThrowsValidationErrorException() {

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.of(existingAccount));

        assertThatThrownBy(() -> accountService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("The user already had an account");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void createWhenCpfAlreadyExistsThrowsValidationErrorException() {

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());
        when(accountRepository.findByCpfAndRemovedFalse(validInput.getCpf())).thenReturn(Optional.of(existingAccount));

        assertThatThrownBy(() -> accountService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("An account already exists for this cpf");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void createWhenCnpjAlreadyExistsThrowsValidationErrorException() {

        validInput.setCpf(null);
        validInput.setCnpj("12.345.678/0001-90");

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());
        when(accountRepository.findByCnpjAndRemovedFalse(validInput.getCnpj())).thenReturn(Optional.of(existingAccount));

        assertThatThrownBy(() -> accountService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("An account already exists for this cnpj");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void updateWithCpfSavesAndReturnsResponse() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.findByCpfAndRemovedFalse(validInput.getCpf())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);

        var result = accountService.update(accountId, validInput);

        assertThat(result).isNotNull();
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void updateWithCnpjSavesAndReturnsResponse() {

        validInput.setCpf(null);
        validInput.setCnpj("12.345.678/0001-90");

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.findByCnpjAndRemovedFalse(validInput.getCnpj())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);

        var result = accountService.update(accountId, validInput);

        assertThat(result).isNotNull();
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void updateWithNullAccountIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> accountService.update(null, validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("accountId is required");
    }

    @Test
    void updateWithoutCpfAndCnpjThrowsValidationErrorException() {

        validInput.setCpf(null);
        validInput.setCnpj(null);

        assertThatThrownBy(() -> accountService.update(accountId, validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("cpf or cnpj is required");

        verify(accountRepository, never()).findByIdAndRemovedFalse(anyString());
    }

    @Test
    void updateWhenAccountNotFoundThrowsNotFoundException() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.update(accountId, validInput))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("account not found by id");
    }

    @Test
    void updateWhenCpfBelongsToAnotherAccountThrowsValidationErrorException() {

        var anotherAccount = Account.builder().id(UUID.randomUUID().toString()).build();

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.findByCpfAndRemovedFalse(validInput.getCpf())).thenReturn(Optional.of(anotherAccount));

        assertThatThrownBy(() -> accountService.update(accountId, validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("An account already exists for this cpf");
    }

    @Test
    void updateWhenCnpjBelongsToAnotherAccountThrowsValidationErrorException() {

        validInput.setCpf(null);
        validInput.setCnpj("12.345.678/0001-90");

        var anotherAccount = Account.builder().id(UUID.randomUUID().toString()).build();

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.findByCnpjAndRemovedFalse(validInput.getCnpj())).thenReturn(Optional.of(anotherAccount));

        assertThatThrownBy(() -> accountService.update(accountId, validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("An account already exists for this cnpj");
    }

    @Test
    void findByIdWhenFoundReturnsPresent() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));

        var result = accountService.findById(accountId);

        assertThat(result).isPresent();
    }

    @Test
    void findByIdWhenNotFoundReturnsEmptyOptional() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.empty());

        var result = accountService.findById(accountId);

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdWithNullIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> accountService.findById(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("accountId is required");
    }

    @Test
    void findByUserIdWhenFoundReturnsAValidUser() {

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.of(existingAccount));

        var result = accountService.findByUserId(userId);

        assertThat(result).isPresent();
    }

    @Test
    void findByUserIdWhenNotFoundReturnsEmptyOptional() {

        when(accountRepository.findByUserIdAndRemovedFalse(userId.toString())).thenReturn(Optional.empty());

        var result = accountService.findByUserId(userId);

        assertThat(result).isEmpty();
    }

    @Test
    void findByUserIdWithNullUserIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> accountService.findByUserId(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("userId is required");
    }

    @Test
    void deactivateSetsRemovedTrueAndSaves() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);

        assertThatNoException().isThrownBy(() -> accountService.deactivate(accountId));

        assertThat(existingAccount.getRemoved()).isTrue();
        verify(accountRepository).save(existingAccount);
    }

    @Test
    void deactivateWithNullAccountIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> accountService.deactivate(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("accountId is required");
    }

    @Test
    void deactivateWhenAccountNotFoundThrowsNotFoundException() {

        when(accountRepository.findByIdAndRemovedFalse(accountId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.deactivate(accountId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void activateSetsRemovedFalseAndSaves() {

        existingAccount.setRemoved(true);
        when(accountRepository.findById(accountId.toString())).thenReturn(Optional.of(existingAccount));
        when(accountRepository.save(any(Account.class))).thenReturn(existingAccount);

        assertThatNoException().isThrownBy(() -> accountService.activate(accountId));

        assertThat(existingAccount.getRemoved()).isFalse();
        verify(accountRepository).save(existingAccount);
    }

    @Test
    void activateWithNullAccountIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> accountService.activate(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("accountId is required");
    }

    @Test
    void activateWhenAccountNotFoundThrowsNotFoundException() {

        when(accountRepository.findById(accountId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.activate(accountId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void activateWhenAccountAlreadyActiveThrowsValidationErrorException() {

        existingAccount.setRemoved(false);
        when(accountRepository.findById(accountId.toString())).thenReturn(Optional.of(existingAccount));

        assertThatThrownBy(() -> accountService.activate(accountId))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("account already active");
    }
}
