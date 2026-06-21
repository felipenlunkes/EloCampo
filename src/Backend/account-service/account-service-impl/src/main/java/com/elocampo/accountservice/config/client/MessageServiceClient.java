package com.elocampo.accountservice.config.client;

import com.elocampo.messageservice.email.EmailInput;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange("/rest/v1/email")
public interface MessageServiceClient {

    @PostExchange()
    void send(@RequestBody EmailInput input);
}
