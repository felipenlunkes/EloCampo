package com.elocampo.messageservice.config.exceptionmapper;

import com.elocampo.messageservice.contract.exceptionhandler.ExceptionErrorResponse;
import com.elocampo.messageservice.exceptions.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class NotFoundExceptionMapper {

    private static final HttpStatus ERROR = HttpStatus.NOT_FOUND;

    @ExceptionHandler(NotFoundException.class)
    protected ResponseEntity<ExceptionErrorResponse> processNotFoundException(NotFoundException exception) {

        var validationError = ExceptionErrorResponse.builder()
                .returnCode(ERROR.value())
                .message(exception.getMessage()).build();
        return ResponseEntity.status(ERROR).body(validationError);
    }
}
