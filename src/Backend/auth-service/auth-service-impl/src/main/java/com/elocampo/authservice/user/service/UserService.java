package com.elocampo.authservice.user.service;

import com.elocampo.authservice.user.UserInput;
import com.elocampo.authservice.user.UserResponse;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserService {

    UserResponse create(@Valid UserInput request);

    Optional<UserResponse> findById(UUID id);

    List<UserResponse> findAll();

    Optional<UserResponse> findByEmail(String email);

    void deactivate(UUID id);

    void activate(UUID id);

    void resetPassword(String email);
}
