package com.elocampo.productservice.config.exceptionmapper;

import com.elocampo.productservice.contract.exceptionhandler.ExceptionErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class ConstraintValidationExceptionMapper {

    private static final HttpStatus ERROR = HttpStatus.BAD_REQUEST;

    @ExceptionHandler(ConstraintViolationException.class)
    protected ResponseEntity<ExceptionErrorResponse> processValidationErrorException(ConstraintViolationException exception) {

        var validationError = ExceptionErrorResponse.builder()
                .returnCode(ERROR.value())
                .message(exception.getMessage()).build();
        return ResponseEntity.status(ERROR).body(validationError);
    }

}
