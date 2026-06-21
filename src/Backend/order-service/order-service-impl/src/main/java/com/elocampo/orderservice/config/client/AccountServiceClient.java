package com.elocampo.orderservice.config.client;

import com.elocampo.accountservice.account.AccountResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/rest/v1")
public interface AccountServiceClient {

    @GetExchange("/account/{id}")
    AccountResponse findAccountById(@PathVariable UUID id);
}
