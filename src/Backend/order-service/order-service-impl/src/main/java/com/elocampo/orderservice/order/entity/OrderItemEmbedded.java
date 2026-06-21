package com.elocampo.orderservice.order.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEmbedded {

    private String productId;
    private String description;
    private BigDecimal quantity;
    private BigDecimal price;
}
