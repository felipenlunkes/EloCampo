package com.elocampo.accountservice.account.mapper;

import com.elocampo.accountservice.account.AccountAddressInput;
import com.elocampo.accountservice.account.AccountPhoneInput;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.accountservice.account.entity.Account;
import com.elocampo.accountservice.account.entity.AccountAddress;
import com.elocampo.accountservice.account.entity.AccountPhone;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AccountMapperTest {

    @Test
    void toAccountAddressMapsAllFields() {

        var input = new AccountAddressInput();

        input.setStreet("Rua das Flores");
        input.setNumber("42");
        input.setCity("Belo Horizonte");
        input.setDistrict("Savassi");
        input.setState("MG");
        input.setComplement("Bloco B");
        input.setPostalCode("30130-110");

        var result = AccountMapper.toAccountAddress(input);

        assertThat(result.getStreet()).isEqualTo("Rua das Flores");
        assertThat(result.getNumber()).isEqualTo("42");
        assertThat(result.getCity()).isEqualTo("Belo Horizonte");
        assertThat(result.getDistrict()).isEqualTo("Savassi");
        assertThat(result.getState()).isEqualTo("MG");
        assertThat(result.getComplement()).isEqualTo("Bloco B");
        assertThat(result.getPostalCode()).isEqualTo("30130-110");
    }

    @Test
    void toAccountPhoneMapsAllFields() {

        var input = new AccountPhoneInput();
        input.setCountryCode(55);
        input.setStateCode(31);
        input.setNumber("912345678");

        var result = AccountMapper.toAccountPhone(input);

        assertThat(result.getCountryCode()).isEqualTo(55);
        assertThat(result.getStateCode()).isEqualTo(31);
        assertThat(result.getNumber()).isEqualTo("912345678");
    }

    @Test
    void toAccountResponseMapsAllFields() {

        var id = UUID.randomUUID();
        var userId = UUID.randomUUID();
        var birthday = Instant.parse("1990-05-15T00:00:00Z");
        var createdAt = Instant.parse("2024-01-10T10:00:00Z");
        var updatedAt = Instant.parse("2024-06-20T15:30:00Z");

        var address = new AccountAddress();
        address.setStreet("Av. Paulista");
        address.setNumber("1000");
        address.setCity("São Paulo");
        address.setDistrict("Bela Vista");
        address.setState("SP");
        address.setComplement("Conj. 101");
        address.setPostalCode("01310-100");

        var phone = new AccountPhone();
        phone.setCountryCode(55);
        phone.setStateCode(11);
        phone.setNumber("987654321");

        var account = Account.builder()
                .id(id.toString())
                .userId(userId.toString())
                .name("Maria Santos")
                .cpf("987.654.321-00")
                .birthdayDate(birthday)
                .address(address)
                .phone(phone)
                .role(AccountRole.VENDOR)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();

        var result = AccountMapper.toAccountResponse(account);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getUserId()).isEqualTo(userId);
        assertThat(result.getName()).isEqualTo("Maria Santos");
        assertThat(result.getCpf()).isEqualTo("987.654.321-00");
        assertThat(result.getRole()).isEqualTo(AccountRole.VENDOR);
        assertThat(result.getBirthdayDate()).isEqualTo(birthday.toEpochMilli());
        assertThat(result.getCreatedAt()).isEqualTo(createdAt.toEpochMilli());
        assertThat(result.getUpdatedAt()).isEqualTo(updatedAt.toEpochMilli());

        assertThat(result.getAddress().getStreet()).isEqualTo("Av. Paulista");
        assertThat(result.getAddress().getNumber()).isEqualTo("1000");
        assertThat(result.getAddress().getCity()).isEqualTo("São Paulo");
        assertThat(result.getAddress().getDistrict()).isEqualTo("Bela Vista");
        assertThat(result.getAddress().getState()).isEqualTo("SP");
        assertThat(result.getAddress().getComplement()).isEqualTo("Conj. 101");
        assertThat(result.getAddress().getPostalCode()).isEqualTo("01310-100");

        assertThat(result.getPhone().getCountryCode()).isEqualTo(55);
        assertThat(result.getPhone().getStateCode()).isEqualTo(11);
        assertThat(result.getPhone().getNumber()).isEqualTo("987654321");
    }

    @Test
    void toAccountResponseWithCnpjMapsCnpj() {

        var id = UUID.randomUUID();
        var userId = UUID.randomUUID();
        var now = Instant.now();

        var account = Account.builder()
                .id(id.toString())
                .userId(userId.toString())
                .name("Empresa Ltda")
                .cnpj("12.345.678/0001-90")
                .birthdayDate(now)
                .address(new AccountAddress())
                .phone(new AccountPhone())
                .role(AccountRole.VENDOR)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var result = AccountMapper.toAccountResponse(account);

        assertThat(result.getCnpj()).isEqualTo("12.345.678/0001-90");
        assertThat(result.getCpf()).isNull();
    }
}
