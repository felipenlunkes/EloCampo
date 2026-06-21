package com.elocampo.orderservice.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @NotNull
    private UUID productId;

    @NotNull
    private String description;

    @NotNull
    @Min(1)
    private BigDecimal quantity;

    @NotNull
    private BigDecimal price;
}
