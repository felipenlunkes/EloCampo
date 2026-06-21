package com.elocampo.messageservice.email.service;

import com.elocampo.messageservice.email.EmailInput;
import com.elocampo.messageservice.email.EmailResponse;
import jakarta.validation.Valid;

public interface EmailService {

    EmailResponse send(@Valid EmailInput input);
}
