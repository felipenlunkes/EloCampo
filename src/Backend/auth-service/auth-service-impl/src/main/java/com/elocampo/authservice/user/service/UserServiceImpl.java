package com.elocampo.authservice.user.service;

import com.elocampo.authservice.config.client.MessageServiceClient;
import com.elocampo.authservice.exceptions.NotFoundException;
import com.elocampo.authservice.exceptions.ValidationErrorException;
import com.elocampo.authservice.user.entity.User;
import com.elocampo.authservice.user.UserInput;
import com.elocampo.authservice.user.UserResponse;
import com.elocampo.authservice.user.mapper.UserMapper;
import com.elocampo.authservice.user.repository.UserRepository;
import com.elocampo.authservice.user.util.PasswordBuilder;
import com.elocampo.authservice.util.UuidV7;
import com.elocampo.messageservice.email.EmailInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Validated
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageServiceClient messageServiceClient;

    @Override
    @Transactional
    public UserResponse create(UserInput request) {

        validateUserCreation(request);

        var now = Instant.now().toEpochMilli();

        var userEntity = User.builder()
                .id(UuidV7.generate().toString())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .admin(request.getAdmin())
                .removed(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var userSaved = userRepository.save(userEntity);
        var userResponse = UserMapper.toUserResponse(userSaved);

        log.info("User created: {}", userResponse);

        return userResponse;
    }

    @Override
    public Optional<UserResponse> findById(UUID id) {

        return userRepository.findByIdAndRemovedFalse(id.toString()).map(UserMapper::toUserResponse);
    }

    @Override
    public List<UserResponse> findAll() {

        var userList =  userRepository.findAll();

        return userList.stream().map(UserMapper::toUserResponse).toList();
    }

    @Override
    public Optional<UserResponse> findByEmail(String email) {

        return userRepository.findByEmailAndRemovedFalse(email).map(UserMapper::toUserResponse);
    }

    @Override
    @Transactional
    public void deactivate(UUID id) {

        var userFound = userRepository.findByIdAndRemovedFalse(id.toString());

        if (userFound.isEmpty()) {
            throw new NotFoundException("User not found");
        }

        userFound.ifPresent(user -> {
            user.setRemoved(true);
            user.setUpdatedAt(Instant.now().toEpochMilli());
            userRepository.save(user);
        });

        log.info("User deactivated: {}", userFound.get());
    }

    @Override
    @Transactional
    public void activate(UUID id) {

        var userFound = userRepository.findById(id.toString());

        if (userFound.isEmpty()) {
            throw new NotFoundException("User not found");
        }

        if (!userFound.get().isRemoved()) {
            throw new ValidationErrorException("user already active. Cannot activate an active user");
        }

        userFound.ifPresent(user -> {
            user.setRemoved(false);
            user.setUpdatedAt(Instant.now().toEpochMilli());
            userRepository.save(user);
        });

        log.info("User activated: {}", userFound.get());
    }

    @Override
    @Transactional
    public void resetPassword(String email) {

        var user = userRepository.findByEmailAndRemovedFalse(email)
                .orElseThrow(() -> new NotFoundException("User not found or inactive"));

        var newPassword = PasswordBuilder.generateRandomPassword();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(System.currentTimeMillis());
        userRepository.save(user);

        sendResetPasswordEmail(user, newPassword);

        log.info("Passwords updated for user (id={}, email={})", user.getId(), email);
    }

    private void validateUserCreation(UserInput request) {

        var userFound = userRepository.findByEmailAndRemovedFalse(request.getEmail());

        if (userFound.isPresent()) {
            throw new ValidationErrorException("An user with this email already exists");
        }
    }

    private void sendResetPasswordEmail(User user, String newPassword) {

        var body = String.format("Olá! Sua nova senha é: <strong>%s</strong><br>Recomendamos que você a troque após o login.", newPassword);

        var emailInput = new EmailInput();
        emailInput.setTo(user.getEmail());
        emailInput.setSubject("Recuperação de senha - EloCampo");
        emailInput.setBody(body);

        messageServiceClient.send(emailInput);

        log.info("Password reset email sent successfully to user (id={}, email={}", user.getId(), user.getEmail());
    }
}
