package com.elocampo.messageservice.email.service;

import com.elocampo.messageservice.email.EmailInput;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "from", "noreply@elocampo.com.br");
    }

    @Test
    void sendReturnsBuildEmailResponse() {

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Bem-vindo")
                .body("<p>Olá!</p>")
                .build();

        var response = emailService.send(input);

        assertThat(response).isNotNull();
    }

    @Test
    void sendCallsMailSenderWithCorrectMessage() {

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        emailService.send(input);

        var captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue()).isNotNull();
    }

    @Test
    void sendThrowsWhenMailSenderFails() {

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        assertThatThrownBy(() -> emailService.send(input))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to send email");
    }

    @Test
    void sendNeverCallsMailSenderWhenCreateMimeMessageFails() {

        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("connection failed"));

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        assertThatThrownBy(() -> emailService.send(input))
                .isInstanceOf(RuntimeException.class);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
