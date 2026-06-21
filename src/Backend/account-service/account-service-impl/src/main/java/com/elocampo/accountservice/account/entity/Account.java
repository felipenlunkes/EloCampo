package com.elocampo.accountservice.account.entity;

import com.elocampo.accountservice.account.AccountRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "account")
public class Account {

    @Id
    private String id;

    private String userId;
    private String name;
    private String businessName;

    @Indexed(unique = true)
    private String cpf;

    @Indexed(unique = true)
    private String cnpj;

    private Instant birthdayDate;
    private AccountAddress address;
    private AccountPhone phone;
    private AccountRole role;
    private Boolean removed;
    private Boolean active;
    private Instant createdAt;
    private Instant updatedAt;
    private Set<AccountEvaluation> evaluation;
}
