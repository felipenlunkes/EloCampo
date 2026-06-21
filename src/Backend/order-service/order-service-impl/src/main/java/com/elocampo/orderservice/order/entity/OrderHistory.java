package com.elocampo.orderservice.order.entity;

import com.elocampo.orderservice.order.OrderHistoryType;
import com.elocampo.orderservice.order.OrderStatus;
import lombok.Data;

import java.time.Instant;

@Data
public class OrderHistory {

    private String id;
    private OrderHistoryType type;
    private OrderStatus status;
    private Instant createdAt;
    private String note;
}
