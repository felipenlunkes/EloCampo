package com.elocampo.fileservice.config.exceptionmapper;

import com.elocampo.fileservice.contract.exceptionhandler.ExceptionErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class ValidationErrorExceptionMapper {

    @ExceptionHandler(IllegalArgumentException.class)
    protected ResponseEntity<ExceptionErrorResponse> handle(IllegalArgumentException exception) {
        var error = ExceptionErrorResponse.builder()
                .returnCode(HttpStatus.BAD_REQUEST.value())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
