package com.elocampo.orderservice.order;

import lombok.Data;

@Data
public class OrderHistoryResponse {

    private OrderHistoryType type;
    private OrderStatus status;
    private Long createdAt;
    private String note;
}
