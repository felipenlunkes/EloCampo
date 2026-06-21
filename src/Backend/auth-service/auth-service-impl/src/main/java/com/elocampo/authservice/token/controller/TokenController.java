package com.elocampo.authservice.token.controller;

import com.elocampo.authservice.token.TokenInput;
import com.elocampo.authservice.token.TokenResponse;
import com.elocampo.authservice.token.TokenValidationResponse;
import com.elocampo.authservice.token.service.TokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/token")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;

    @PostMapping
    public ResponseEntity<TokenResponse> generate(@Valid @RequestBody TokenInput request) {
        return ResponseEntity.ok(tokenService.generate(request));
    }

    @GetMapping("/validate")
    public ResponseEntity<TokenValidationResponse> validate(@RequestParam String token) {
        return ResponseEntity.ok(tokenService.validate(token));
    }
}
