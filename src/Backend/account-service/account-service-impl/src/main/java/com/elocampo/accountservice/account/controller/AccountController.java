package com.elocampo.accountservice.account.controller;

import com.elocampo.accountservice.account.AccountEvaluationInput;
import com.elocampo.accountservice.account.AccountInput;
import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.service.AccountService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> create(@RequestBody AccountInput request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.create(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<AccountResponse>> findAll() {
        return ResponseEntity.ok(accountService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> findById(@PathVariable @NotNull UUID id) {
        return accountService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> update(@PathVariable @NotNull UUID id, @RequestBody AccountInput request) {
        return ResponseEntity.status(HttpStatus.OK).body(accountService.update(id, request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<AccountResponse> findByUserId(@PathVariable UUID userId) {
        return accountService.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        accountService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable UUID id) {
        accountService.activate(id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{accountId}/evaluate")
    public ResponseEntity<AccountResponse> evaluate(
            @PathVariable @NotNull UUID accountId,
            @Valid @RequestBody AccountEvaluationInput request) {
        return accountService.evaluate(accountId, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
