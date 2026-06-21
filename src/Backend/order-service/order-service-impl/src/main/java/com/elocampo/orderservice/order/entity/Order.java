package com.elocampo.orderservice.order.entity;

import com.elocampo.orderservice.order.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "order")
public class Order {

    @Id
    private String id;

    private String buyerAccountId;
    private String sellerAccountId;
    private OrderStatus status;
    private Set<OrderItemEmbedded> products;
    private Set<OrderHistory> history;
    private BigDecimal price;
    private Instant createdAt;
    private Instant updatedAt;
}
