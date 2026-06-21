package com.elocampo.fileservice.config.client;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

import java.util.Map;
import java.util.UUID;

@HttpExchange("/rest/v1")
public interface ProductServiceClient {

    @GetExchange("/product/{id}")
    Map<String, Object> findById(@PathVariable UUID id);
}
