package com.elocampo.orderservice.order.mapper;

import com.elocampo.orderservice.order.OrderItem;
import com.elocampo.orderservice.order.OrderStatus;
import com.elocampo.orderservice.order.entity.Order;
import com.elocampo.orderservice.order.entity.OrderItemEmbedded;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMapperTest {

    @Test
    void toOrderResponseMapsAllFields() {

        var id = UUID.randomUUID();
        var buyerAccountId = UUID.randomUUID();
        var sellerAccountId = UUID.randomUUID();
        var productId = UUID.randomUUID();
        var createdAt = Instant.parse("2026-01-10T10:00:00Z");
        var updatedAt = Instant.parse("2026-03-15T12:00:00Z");

        var item = new OrderItemEmbedded(productId.toString(), "Tomate orgânico", new BigDecimal("2"), new BigDecimal("12.50"));

        var order = Order.builder()
                .id(id.toString())
                .buyerAccountId(buyerAccountId.toString())
                .sellerAccountId(sellerAccountId.toString())
                .status(OrderStatus.PENDING)
                .products(Set.of(item))
                .price(new BigDecimal("25.00"))
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();

        var result = OrderMapper.toOrderResponse(order);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getBuyerAccountId()).isEqualTo(buyerAccountId);
        assertThat(result.getSellerAccountId()).isEqualTo(sellerAccountId);
        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(result.getProducts()).hasSize(1);
        assertThat(result.getProducts().getFirst().getProductId()).isEqualTo(productId);
        assertThat(result.getProducts().getFirst().getDescription()).isEqualTo("Tomate orgânico");
        assertThat(result.getProducts().getFirst().getQuantity()).isEqualByComparingTo(new BigDecimal("2"));
        assertThat(result.getProducts().getFirst().getPrice()).isEqualByComparingTo(new BigDecimal("12.50"));
        assertThat(result.getCreatedAt()).isEqualTo(createdAt.toEpochMilli());
        assertThat(result.getUpdatedAt()).isEqualTo(updatedAt.toEpochMilli());
    }

    @Test
    void toOrderResponseMapsCorrectEpochMilliConversion() {

        var id = UUID.randomUUID();
        var fixedInstant = Instant.ofEpochMilli(1_700_000_000_000L);
        var item = new OrderItemEmbedded(UUID.randomUUID().toString(), "Item", new BigDecimal("1"), new BigDecimal("10.00"));

        var order = Order.builder()
                .id(id.toString())
                .buyerAccountId(UUID.randomUUID().toString())
                .sellerAccountId(UUID.randomUUID().toString())
                .status(OrderStatus.PENDING)
                .products(Set.of(item))
                .price(new BigDecimal("10.00"))
                .createdAt(fixedInstant)
                .updatedAt(fixedInstant)
                .build();

        var result = OrderMapper.toOrderResponse(order);

        assertThat(result.getCreatedAt()).isEqualTo(1_700_000_000_000L);
        assertThat(result.getUpdatedAt()).isEqualTo(1_700_000_000_000L);
    }

    @Test
    void toOrderResponseWithMultipleProductsMapsAll() {

        var id = UUID.randomUUID();
        var now = Instant.now();
        var item1 = new OrderItemEmbedded(UUID.randomUUID().toString(), "Tomate", new BigDecimal("2"), new BigDecimal("5.00"));
        var item2 = new OrderItemEmbedded(UUID.randomUUID().toString(), "Alface", new BigDecimal("1"), new BigDecimal("3.00"));
        var item3 = new OrderItemEmbedded(UUID.randomUUID().toString(), "Cenoura", new BigDecimal("4"), new BigDecimal("2.50"));

        var order = Order.builder()
                .id(id.toString())
                .buyerAccountId(UUID.randomUUID().toString())
                .sellerAccountId(UUID.randomUUID().toString())
                .status(OrderStatus.PENDING)
                .products(Set.of(item1, item2, item3))
                .price(new BigDecimal("23.00"))
                .createdAt(now)
                .updatedAt(now)
                .build();

        var result = OrderMapper.toOrderResponse(order);

        assertThat(result.getProducts()).hasSize(3);
        assertThat(result.getProducts())
                .map(OrderItem::getDescription)
                .containsExactlyInAnyOrder("Tomate", "Alface", "Cenoura");
    }
}