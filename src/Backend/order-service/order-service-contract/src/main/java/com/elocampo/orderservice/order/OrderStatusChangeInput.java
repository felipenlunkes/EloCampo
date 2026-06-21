package com.elocampo.orderservice.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OrderStatusChangeInput {

    @NotNull(message = "status is required")
    private OrderStatus status;

    @Size(min = 10, max = 500, message = "note cannot have less than 10 and more than 500 characters")
    private String note;
}
