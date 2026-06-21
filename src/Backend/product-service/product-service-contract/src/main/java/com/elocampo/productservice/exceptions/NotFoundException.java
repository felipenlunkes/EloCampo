package com.elocampo.productservice.exceptions;

public class NotFoundException extends RuntimeException {

    public NotFoundException() {

    }

    public NotFoundException(String errorMessage) {
        super(errorMessage);
    }

    public NotFoundException(String errorMessage, Throwable cause) {
        super(errorMessage, cause);
    }

    public NotFoundException(Throwable cause) {
        super(cause);
    }
}
