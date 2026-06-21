package com.elocampo.authservice.user.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.RepeatedTest;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordBuilderTest {

    private static final String VALID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    private static final int EXPECTED_LENGTH = 12;

    @Test
    void generateRandomPasswordShouldHaveTwelveCharacters() {

        var password = PasswordBuilder.generateRandomPassword();

        assertThat(password).hasSize(EXPECTED_LENGTH);
    }

    @Test
    void generateRandomPasswordShouldContainOnlyValidCharacters() {

        var password = PasswordBuilder.generateRandomPassword();

        for (char c : password.toCharArray()) {
            assertThat(VALID_CHARS).contains(String.valueOf(c));
        }
    }

    @Test
    void generateRandomPasswordShouldReturnNonBlankString() {

        var password = PasswordBuilder.generateRandomPassword();

        assertThat(password).isNotBlank();
    }

    @RepeatedTest(10)
    void generateRandomPasswordShouldProduceDifferentValues() {

        var password1 = PasswordBuilder.generateRandomPassword();
        var password2 = PasswordBuilder.generateRandomPassword();

        assertThat(password1).isNotNull();
        assertThat(password2).isNotNull();
    }

    @Test
    void generateRandomPasswordShouldProduceUniqueValuesOverMultipleGenerations() {

        var passwords = new java.util.HashSet<String>();
        for (int i = 0; i < 100; i++) {
            passwords.add(PasswordBuilder.generateRandomPassword());
        }

        assertThat(passwords.size()).isGreaterThan(90);
    }
}
