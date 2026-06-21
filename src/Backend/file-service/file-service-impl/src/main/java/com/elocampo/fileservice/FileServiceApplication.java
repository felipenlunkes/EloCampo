package com.elocampo.fileservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class FileServiceApplication {

	static void main(String[] args) {
		SpringApplication.run(FileServiceApplication.class, args);
	}

}
