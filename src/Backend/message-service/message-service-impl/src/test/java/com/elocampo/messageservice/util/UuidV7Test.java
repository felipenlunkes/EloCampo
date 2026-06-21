package com.elocampo.messageservice.util;

import org.junit.jupiter.api.Test;

import java.util.HashSet;

import static org.assertj.core.api.Assertions.assertThat;

class UuidV7Test {

    @Test
    void generateReturnsNonNullUuid() {

        assertThat(UuidV7.generate()).isNotNull();
    }

    @Test
    void generateReturnsVersion7Uuid() {

        var uuid = UuidV7.generate();

        assertThat(uuid.version()).isEqualTo(7);
    }

    @Test
    void generateReturnsUniqueValues() {

        var uuids = new HashSet<String>();
        for (int i = 0; i < 1000; i++) {
            uuids.add(UuidV7.generate().toString());
        }

        assertThat(uuids).hasSize(1000);
    }

    @Test
    void generateReturnsChronologicallyOrderedUuids() {

        var uuid1 = UuidV7.generate();
        var uuid2 = UuidV7.generate();

        // Compare only the timestamp portion (top 48 bits of MSB), ignoring version and randA fields
        assertThat(uuid1.getMostSignificantBits() >>> 16).isLessThanOrEqualTo(uuid2.getMostSignificantBits() >>> 16);
    }
}
