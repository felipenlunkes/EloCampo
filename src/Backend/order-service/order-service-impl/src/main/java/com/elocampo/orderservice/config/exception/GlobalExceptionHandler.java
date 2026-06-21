package com.elocampo.orderservice.config.exception;

import com.elocampo.orderservice.exceptions.NotFoundException;
import com.elocampo.orderservice.exceptions.ValidationErrorException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final static HttpStatus NOT_FOUND_ERROR = HttpStatus.NOT_FOUND;
    private final static HttpStatus UNPROCESSABLE_CONTENT_ERROR = HttpStatus.UNPROCESSABLE_CONTENT;
    private final static HttpStatus METHOD_ARGUMENT_NOT_VALID = HttpStatus.BAD_REQUEST;
    private final static HttpStatus REST_CLIENT_ERROR = HttpStatus.SERVICE_UNAVAILABLE;

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> notFoundException(NotFoundException e) {
        var notFoundError = ErrorResponse.builder()
                .message(e.getMessage())
                .status(NOT_FOUND_ERROR.value())
                .timestamp(Instant.now().toEpochMilli())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(notFoundError);
    }

    @ExceptionHandler(ValidationErrorException.class)
    public ResponseEntity<ErrorResponse> unprocessableEntityException(ValidationErrorException e) {
        var notFoundError = ErrorResponse.builder()
                .message(e.getMessage())
                .status(UNPROCESSABLE_CONTENT_ERROR.value())
                .timestamp(Instant.now().toEpochMilli())
                .build();

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(notFoundError);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> methodArgumentNotValidException(MethodArgumentNotValidException e) {
        var argumentNotValidError = ErrorResponse.builder()
                .message(e.getBindingResult().getFieldErrors().getFirst().getDefaultMessage())
                .status(METHOD_ARGUMENT_NOT_VALID.value())
                .timestamp(Instant.now().toEpochMilli())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(argumentNotValidError);
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ErrorResponse> restClientException(RestClientException e) {
        var restClientError = ErrorResponse.builder()
                .message(e.getMessage())
                .status(REST_CLIENT_ERROR.value())
                .timestamp(Instant.now().toEpochMilli())
                .build();

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(restClientError);
    }
}

