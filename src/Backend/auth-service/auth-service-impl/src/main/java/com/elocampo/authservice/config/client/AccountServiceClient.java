package com.elocampo.authservice.config.client;

import com.elocampo.accountservice.account.AccountResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/rest/v1/account")
public interface AccountServiceClient {

    @GetExchange("/{id}")
    AccountResponse findById(@PathVariable UUID id);

    @GetExchange("/user/{userId}")
    AccountResponse findByUserId(@PathVariable UUID userId);
}
