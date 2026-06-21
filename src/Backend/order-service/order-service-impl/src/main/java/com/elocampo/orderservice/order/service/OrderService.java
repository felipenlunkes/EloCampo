package com.elocampo.orderservice.order.service;

import com.elocampo.orderservice.order.OrderInput;
import com.elocampo.orderservice.order.OrderResponse;
import com.elocampo.orderservice.order.OrderStatusChangeInput;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderService {

    OrderResponse create(@Valid OrderInput request);

    List<OrderResponse> findAll();

    Optional<OrderResponse> findById(UUID id);

    void changeStatus(UUID orderId, @Valid OrderStatusChangeInput input);

    Page<OrderResponse> findByBuyerAccountId(UUID buyerAccountId, Pageable pageable);

    Page<OrderResponse> findBySellerAccountId(UUID sellerAccountId, Pageable pageable);
}
