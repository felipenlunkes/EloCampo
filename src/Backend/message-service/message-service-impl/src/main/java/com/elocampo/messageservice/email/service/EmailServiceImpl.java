package com.elocampo.messageservice.email.service;

import com.elocampo.messageservice.email.EmailInput;
import com.elocampo.messageservice.email.EmailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

@Service
@Slf4j
@RequiredArgsConstructor
@Validated
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${email.from}")
    private String from;

    @Override
    public EmailResponse send(EmailInput input) {

        try {

            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(input.getTo());
            helper.setSubject(input.getSubject());
            helper.setText(input.getBody(), true);

            mailSender.send(message);

            log.info("Email sent successfully to {}", input.getTo());

            return EmailResponse.builder().build();

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", input.getTo(), e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
