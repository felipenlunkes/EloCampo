package com.elocampo.messageservice.email.controller;

import com.elocampo.messageservice.email.EmailInput;
import com.elocampo.messageservice.email.EmailResponse;
import com.elocampo.messageservice.email.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<EmailResponse> send(@RequestBody @Valid EmailInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emailService.send(input));
    }
}
