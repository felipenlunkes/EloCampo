package com.elocampo.accountservice.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountInput {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotBlank(message = "name is required")
    @Size(max = 70, message = "name cannot be greater than 70 characters")
    private String name;

    @Size(max = 70, message = "businessName cannot be greater than 70 characters")
    private String businessName;

    private String cpf;
    private String cnpj;

    @NotNull(message = "birthdayDate is required")
    private Long birthdayDate;

    @NotNull(message = "address is required")
    private @Valid AccountAddressInput address;

    @NotNull(message = "phone is required")
    private @Valid AccountPhoneInput phone;

    @NotNull(message = "role is required")
    private AccountRole role;
}
