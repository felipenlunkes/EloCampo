package com.elocampo.accountservice.account.service;

import com.elocampo.accountservice.account.AccountEvaluationInput;
import com.elocampo.accountservice.account.AccountInput;
import com.elocampo.accountservice.account.AccountResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.apache.catalina.mapper.Mapper;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountService {
    AccountResponse create(@Valid AccountInput request);

    AccountResponse update(UUID accountId, @Valid AccountInput request);

    Optional<AccountResponse> findById(UUID accountId);

    List<AccountResponse> findAll();

    Optional<AccountResponse> findByUserId(UUID userId);

    void deactivate(UUID accountId);

    void activate(UUID accountId);

    Optional<AccountResponse> evaluate(UUID accountId, @Valid AccountEvaluationInput request);
}
