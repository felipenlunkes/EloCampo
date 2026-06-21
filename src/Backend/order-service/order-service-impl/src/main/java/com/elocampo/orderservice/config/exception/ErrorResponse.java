package com.elocampo.orderservice.config.exception;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ErrorResponse {
    private String message;
    private Integer status;
    private Long timestamp;
}
