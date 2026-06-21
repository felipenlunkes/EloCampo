package com.elocampo.orderservice.order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private UUID id;
    private UUID buyerAccountId;
    private UUID sellerAccountId;
    private OrderStatus orderStatus;
    private List<OrderItem> products;
    private Set<OrderHistoryResponse> history;
    private BigDecimal price;
    private Long createdAt;
    private Long updatedAt;
}
