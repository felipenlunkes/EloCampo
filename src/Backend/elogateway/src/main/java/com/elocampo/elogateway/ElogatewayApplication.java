package com.elocampo.elogateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class ElogatewayApplication {

	static void main(String[] args) {
		SpringApplication.run(ElogatewayApplication.class, args);
	}

}
