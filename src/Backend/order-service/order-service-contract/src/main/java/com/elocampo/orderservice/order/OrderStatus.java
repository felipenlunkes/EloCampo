package com.elocampo.orderservice.order;

import com.elocampo.orderservice.exceptions.ValidationErrorException;

import java.util.Set;

public enum OrderStatus {
    ACCEPTED,
    COMPLETED,
    CANCELLED,
    PENDING;

    public static Set<OrderStatus> validStatusToChange(OrderStatus currentStatus) {

        if (currentStatus == null) {
            throw new ValidationErrorException("currentStatus cannot be null");
        }

        switch (currentStatus) {
            case PENDING -> {
                return Set.of(ACCEPTED, COMPLETED, CANCELLED);
            }
            case ACCEPTED, COMPLETED -> {
                return Set.of(COMPLETED);
            }
        }

        return Set.of();
    }
}
