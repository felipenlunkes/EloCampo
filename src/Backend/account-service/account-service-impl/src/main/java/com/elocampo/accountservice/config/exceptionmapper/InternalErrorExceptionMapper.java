package com.elocampo.accountservice.config.exceptionmapper;

import com.elocampo.accountservice.contract.exceptionhandler.ExceptionErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.HttpServerErrorException;

@ControllerAdvice
public class InternalErrorExceptionMapper {

    private static final HttpStatus ERROR = HttpStatus.INTERNAL_SERVER_ERROR;

    @ExceptionHandler(HttpServerErrorException.InternalServerError.class)
    protected ResponseEntity<ExceptionErrorResponse> processValidationErrorException(HttpServerErrorException.InternalServerError exception) {

        var validationError = ExceptionErrorResponse.builder()
                .returnCode(ERROR.value())
                .message(exception.getMessage()).build();
        return ResponseEntity.status(ERROR).body(validationError);
    }

}
