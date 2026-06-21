package com.elocampo.orderservice.order.mapper;

import com.elocampo.orderservice.order.OrderHistoryResponse;
import com.elocampo.orderservice.order.OrderItem;
import com.elocampo.orderservice.order.OrderResponse;
import com.elocampo.orderservice.order.entity.Order;
import com.elocampo.orderservice.order.entity.OrderHistory;

import java.util.UUID;
import java.util.stream.Collectors;


public class OrderMapper {

    public static OrderResponse toOrderResponse(Order order) {

        var response = new OrderResponse();

        response.setId(UUID.fromString(order.getId()));
        response.setBuyerAccountId(UUID.fromString(order.getBuyerAccountId()));
        response.setSellerAccountId(UUID.fromString(order.getSellerAccountId()));
        response.setOrderStatus(order.getStatus());
        response.setPrice(order.getPrice());
        response.setCreatedAt(order.getCreatedAt().toEpochMilli());
        response.setUpdatedAt(order.getUpdatedAt().toEpochMilli());

        if (order.getProducts() != null) {
            var products = order.getProducts().stream()
                    .map(item -> new OrderItem(
                            UUID.fromString(item.getProductId()),
                            item.getDescription(),
                            item.getQuantity(),
                            item.getPrice()
                    )).toList();

            response.setProducts(products);
        }

        if (order.getHistory() != null) {
            response.setHistory(order.getHistory().stream().map(OrderMapper::toHistoryResponse).collect(Collectors.toSet()));
        }

        return response;
    }

    private static OrderHistoryResponse toHistoryResponse(OrderHistory input) {

        var orderHistory = new OrderHistoryResponse();
        orderHistory.setType(input.getType());
        orderHistory.setStatus(input.getStatus());
        orderHistory.setNote(input.getNote());
        orderHistory.setCreatedAt(input.getCreatedAt().toEpochMilli());

        return orderHistory;
    }
}
