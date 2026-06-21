package com.elocampo.fileservice.config.exceptionmapper;

import com.elocampo.fileservice.contract.exceptionhandler.ExceptionErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.NoSuchElementException;

@ControllerAdvice
public class NotFoundExceptionMapper {

    @ExceptionHandler(NoSuchElementException.class)
    protected ResponseEntity<ExceptionErrorResponse> handle(NoSuchElementException exception) {
        var error = ExceptionErrorResponse.builder()
                .returnCode(HttpStatus.NOT_FOUND.value())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
