package com.elocampo.messageservice.email;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailResponse {

    private String messageId;
}
