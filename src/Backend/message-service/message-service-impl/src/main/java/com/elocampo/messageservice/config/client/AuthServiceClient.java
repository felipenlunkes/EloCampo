package com.elocampo.messageservice.config.client;

import com.elocampo.authservice.token.TokenValidationResponse;
import com.elocampo.authservice.user.UserResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.UUID;

@HttpExchange("/rest/v1")
public interface AuthServiceClient {

    @GetExchange("/token/validate")
    TokenValidationResponse validateToken(@RequestParam String token);

    @GetExchange("/user/{id}")
    UserResponse findUserById(@PathVariable UUID id);
}
