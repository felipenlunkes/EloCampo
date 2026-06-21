package com.elocampo.messageservice.config.exceptionmapper;

import com.elocampo.messageservice.exceptions.ValidationErrorException;
import com.elocampo.messageservice.contract.exceptionhandler.ExceptionErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class ValidationErrorExceptionMapper {

    private static final HttpStatus ERROR = HttpStatus.BAD_REQUEST;

    @ExceptionHandler(ValidationErrorException.class)
    protected ResponseEntity<ExceptionErrorResponse> processValidationErrorException(ValidationErrorException exception) {

        var validationError = ExceptionErrorResponse.builder()
                .returnCode(ERROR.value())
                .message(exception.getMessage()).build();
        return ResponseEntity.status(ERROR).body(validationError);
    }

}
