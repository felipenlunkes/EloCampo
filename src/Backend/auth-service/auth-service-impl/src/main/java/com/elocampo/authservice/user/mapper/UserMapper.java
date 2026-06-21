package com.elocampo.authservice.user.mapper;

import com.elocampo.authservice.user.UserResponse;
import com.elocampo.authservice.user.entity.User;

import java.util.UUID;

public class UserMapper {

    public static UserResponse toUserResponse(User user) {

        return new UserResponse(
                UUID.fromString(user.getId()),
                user.getEmail(),
                user.isAdmin(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
