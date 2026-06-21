package com.elocampo.authservice.util;

import java.security.SecureRandom;
import java.util.UUID;

public final class UuidV7 {

    private static final SecureRandom RANDOM = new SecureRandom();

    private UuidV7() {}

    public static UUID generate() {

        var timestamp = System.currentTimeMillis();
        var randA = RANDOM.nextLong() & 0xFFFL;
        var msb = (timestamp << 16) | (7L << 12) | randA;

        var randB = RANDOM.nextLong();
        var lsb = (randB & 0x3FFFFFFFFFFFFFFFL) | Long.MIN_VALUE;

        return new UUID(msb, lsb);
    }
}
