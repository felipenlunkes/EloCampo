package com.elocampo.authservice.contract.exceptionhandler;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExceptionErrorResponse {

    private Integer returnCode;
    private String message;
}
