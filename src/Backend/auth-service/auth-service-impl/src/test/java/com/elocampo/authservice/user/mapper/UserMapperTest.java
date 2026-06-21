package com.elocampo.authservice.user.mapper;

import com.elocampo.authservice.user.entity.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserMapperTest {

    @Test
    void toUserResponseMapsAllFields() {

        var id = UUID.randomUUID();
        var now = System.currentTimeMillis();

        var user = User.builder()
                .id(id.toString())
                .email("mapper@example.com")
                .password("secret")
                .admin(true)
                .removed(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var result = UserMapper.toUserResponse(user);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.email()).isEqualTo("mapper@example.com");
        assertThat(result.isAdmin()).isTrue();
        assertThat(result.createdAt()).isEqualTo(now);
        assertThat(result.updatedAt()).isEqualTo(now);
    }

    @Test
    void toUserResponseDoesNotExposePassword() {

        var user = User.builder()
                .id(UUID.randomUUID().toString())
                .email("test@example.com")
                .password("sensitivePassword")
                .admin(false)
                .removed(false)
                .createdAt(1000L)
                .updatedAt(1000L)
                .build();

        var result = UserMapper.toUserResponse(user);

        assertThat(result).isNotNull();
        // UserResponse record has no password field — mapping must never include it
        assertThat(result.getClass().getDeclaredFields())
                .noneMatch(f -> f.getName().equalsIgnoreCase("password"));
    }

    @Test
    void toUserResponseMapsAdminFalseCorrectly() {

        var user = User.builder()
                .id(UUID.randomUUID().toString())
                .email("regular@example.com")
                .password("pass")
                .admin(false)
                .removed(false)
                .createdAt(500L)
                .updatedAt(600L)
                .build();

        var result = UserMapper.toUserResponse(user);

        assertThat(result.isAdmin()).isFalse();
        assertThat(result.createdAt()).isEqualTo(500L);
        assertThat(result.updatedAt()).isEqualTo(600L);
    }
}
