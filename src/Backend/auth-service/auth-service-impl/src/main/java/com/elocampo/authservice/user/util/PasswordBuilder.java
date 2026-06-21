package com.elocampo.authservice.user.util;

import java.security.SecureRandom;

public class PasswordBuilder {

    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateRandomPassword() {

        var sb = new StringBuilder(12);

        for (int i = 0; i < 12; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }

        return sb.toString();
    }

}
