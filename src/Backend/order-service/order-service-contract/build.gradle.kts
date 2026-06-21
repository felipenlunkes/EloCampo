plugins {
	`java-library`
	`maven-publish`
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.elocampo"
version = "1.0.0"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

dependencyManagement {
	imports {
		mavenBom("org.springframework.boot:spring-boot-dependencies:4.0.3")
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

dependencies {
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")
	api("jakarta.validation:jakarta.validation-api")
	api("com.fasterxml.jackson.core:jackson-annotations")
}

publishing {
	publications {
		create<MavenPublication>("maven") {
			from(components["java"])
			versionMapping {
				usage("java-api") {
					fromResolutionOf("runtimeClasspath")
				}
				usage("java-runtime") {
					fromResolutionResult()
				}
			}
		}
	}
}
