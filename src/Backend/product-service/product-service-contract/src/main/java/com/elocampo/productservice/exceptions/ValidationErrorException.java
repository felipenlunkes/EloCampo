package com.elocampo.productservice.exceptions;

public class ValidationErrorException extends RuntimeException {

    public ValidationErrorException() {
    }

    public ValidationErrorException(String errorMessage) {
        super(errorMessage);
    }

    public ValidationErrorException(String errorMessage, Throwable cause) {
        super(errorMessage, cause);
    }

    public ValidationErrorException(Throwable cause) {
        super(cause);
    }
}
