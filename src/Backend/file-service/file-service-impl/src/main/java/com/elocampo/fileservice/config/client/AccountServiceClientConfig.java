package com.elocampo.fileservice.config.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.util.NoSuchElementException;

@Configuration
public class AccountServiceClientConfig {

    @Bean
    public AccountServiceClient accountServiceClient(
            @Value("${services.account-service.url}") String baseUrl) {

        var restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultStatusHandler(
                        status -> status == HttpStatus.NOT_FOUND,
                        (request, response) -> {
                            throw new NoSuchElementException("Conta não encontrada: " + request.getURI());
                        }
                )
                .build();

        var adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter).build();
        return factory.createClient(AccountServiceClient.class);
    }
}
