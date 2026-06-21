package com.elocampo.elogateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "token")
public class JwtProperties {

    private String secret;
    private List<PublicEndpoint> publicEndpoints = List.of();
}
