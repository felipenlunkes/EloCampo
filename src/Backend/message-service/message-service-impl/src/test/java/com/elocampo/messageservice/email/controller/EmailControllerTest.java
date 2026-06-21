package com.elocampo.messageservice.email.controller;

import com.elocampo.messageservice.email.EmailInput;
import com.elocampo.messageservice.email.EmailResponse;
import com.elocampo.messageservice.email.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmailControllerTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private EmailController emailController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(emailController).build();
    }

    @Test
    void sendReturns201WithEmailResponse() throws Exception {

        when(emailService.send(any())).thenReturn(EmailResponse.builder().build());

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Bem-vindo")
                .body("<p>Olá!</p>")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated());
    }

    @Test
    void sendDelegatesInputToService() throws Exception {

        when(emailService.send(any())).thenReturn(EmailResponse.builder().build());

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)));

        verify(emailService).send(input);
    }

    @Test
    void sendReturns400WhenToIsBlank() throws Exception {

        var input = EmailInput.builder()
                .to("")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendReturns400WhenToIsInvalidEmail() throws Exception {

        var input = EmailInput.builder()
                .to("nao-e-um-email")
                .subject("Assunto")
                .body("<p>Corpo</p>")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendReturns400WhenSubjectIsBlank() throws Exception {

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("")
                .body("<p>Corpo</p>")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendReturns400WhenBodyIsBlank() throws Exception {

        var input = EmailInput.builder()
                .to("cliente@exemplo.com")
                .subject("Assunto")
                .body("")
                .build();

        mockMvc.perform(post("/v1/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());
    }
}
