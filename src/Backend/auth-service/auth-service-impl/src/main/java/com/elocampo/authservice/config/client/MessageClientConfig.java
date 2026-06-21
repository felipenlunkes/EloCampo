package com.elocampo.authservice.config.client;

import com.elocampo.authservice.exceptions.NotFoundException;
import com.elocampo.authservice.exceptions.ValidationErrorException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class MessageClientConfig {

    @Bean
    public MessageServiceClient messageServiceClient(
            @Value("${services.message-service.url}") String baseUrl,
            ObjectMapper objectMapper) {

        var restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultStatusHandler(
                        status -> status == HttpStatus.NOT_FOUND,
                        (request, response) -> {
                            throw new NotFoundException("Entity not found: %s %s".formatted(request.getMethod(), request.getURI()));
                        }
                )
                .defaultStatusHandler(
                        status -> status == HttpStatus.BAD_REQUEST || status == HttpStatus.UNPROCESSABLE_ENTITY,
                        (request, response) -> {
                            var body = objectMapper.readValue(response.getBody(), ClientErrorResponse.class);
                            throw new ValidationErrorException(body.message());
                        }
                )
                .build();

        var adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter).build();

        return factory.createClient(MessageServiceClient.class);
    }

    private record ClientErrorResponse(Integer returnCode, String message) {}
}
