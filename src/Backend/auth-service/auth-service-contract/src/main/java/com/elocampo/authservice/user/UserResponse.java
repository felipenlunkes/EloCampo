package com.elocampo.authservice.user;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        Boolean isAdmin,
        Long createdAt,
        Long updatedAt
) {}
