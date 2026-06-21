package com.elocampo.authservice.config.token;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "token")
@Data
public class TokenConfig {

    private String jwtSecret;
    private Integer expirationDays;
}
