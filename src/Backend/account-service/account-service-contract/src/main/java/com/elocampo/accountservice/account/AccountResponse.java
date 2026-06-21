package com.elocampo.accountservice.account;

import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class AccountResponse {

    private UUID id;
    private UUID userId;
    private String name;
    private String businessName;
    private String cpf;
    private String cnpj;
    private Long birthdayDate;
    private AccountAddressResponse address;
    private AccountPhoneResponse phone;
    private AccountRole role;
    private Long createdAt;
    private Long updatedAt;
    private Set<AccountEvaluationResponse> evaluation;
}
