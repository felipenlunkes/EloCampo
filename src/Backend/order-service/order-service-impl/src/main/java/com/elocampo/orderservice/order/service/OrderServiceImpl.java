package com.elocampo.orderservice.order.service;

import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.orderservice.config.client.AccountServiceClient;
import com.elocampo.orderservice.exceptions.NotFoundException;
import com.elocampo.orderservice.order.*;
import com.elocampo.orderservice.order.entity.Order;
import com.elocampo.orderservice.order.entity.OrderItemEmbedded;
import com.elocampo.orderservice.order.entity.OrderHistory;
import com.elocampo.orderservice.order.mapper.OrderMapper;
import com.elocampo.orderservice.order.repository.OrderRepository;
import com.elocampo.orderservice.exceptions.ValidationErrorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Validated
@Slf4j
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final AccountServiceClient accountServiceClient;
    private final OrderRepository orderRepository;

    @Transactional
    @Override
    public OrderResponse create(OrderInput request) {

        validateCostumerAccount(request.getBuyerAccountId());

        var products = request.getProductsIds().stream()
                .map(item -> new OrderItemEmbedded(item.getProductId().toString(), item.getDescription(), item.getQuantity(), item.getPrice()))
                .collect(Collectors.toSet());

        var totalPrice = products.stream()
                .map(item -> item.getPrice().multiply(item.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var orderEntity = Order.builder()
                .id(UUID.randomUUID().toString())
                .buyerAccountId(request.getBuyerAccountId().toString())
                .sellerAccountId(request.getSellerAccountId().toString())
                .status(OrderStatus.PENDING)
                .products(products)
                .price(totalPrice)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        var saved = orderRepository.save(orderEntity);
        var orderResponse = OrderMapper.toOrderResponse(saved);

        log.info("Order created: {}", orderResponse);

        return orderResponse;
    }

    @Override
    public List<OrderResponse> findAll() {

        var orderList = orderRepository.findAll();

        return orderList.stream().map(OrderMapper::toOrderResponse).collect(Collectors.toList());
    }

    @Override
    public Optional<OrderResponse> findById(UUID id) {

        if (id == null) {
            throw new ValidationErrorException("id is required");
        }

        return orderRepository.findById(id.toString()).map(OrderMapper::toOrderResponse);
    }

    @Transactional
    @Override
    public void changeStatus(UUID orderId, OrderStatusChangeInput input) {

        var orderFound = orderRepository.findById(orderId.toString());

        if (orderFound.isEmpty()) {
            throw new NotFoundException("order not found by id");
        }

        var order = orderFound.get();

        validateStatusChange(input, order);

        if (order.getHistory() == null) {
            order.setHistory(new HashSet<>());
        }

        var now = Instant.now();

        var history = new OrderHistory();
        history.setId(UUID.randomUUID().toString());
        history.setStatus(input.getStatus());
        history.setType(OrderHistoryType.STATUS_CHANGE);
        history.setNote(input.getNote());
        history.setCreatedAt(now);

        order.setStatus(input.getStatus());

        order.getHistory().add(history);
        order.setUpdatedAt(now);

        orderRepository.save(order);

        log.info("Changed order status: {}", order);
    }

    private void validateStatusChange(OrderStatusChangeInput input, Order order) {

        if (OrderStatus.COMPLETED.equals(order.getStatus())) {
            throw new ValidationErrorException("Cannot change status from COMPLETED to COMPLETED");
        }

        var allowedNextStatus = OrderStatus.validStatusToChange(order.getStatus());

        if (!allowedNextStatus.contains(input.getStatus())) {
            throw new ValidationErrorException(String.format("Cannot change status to %s. Valid next status: %s", input.getStatus(), allowedNextStatus));
        }
    }

    @Override
    public Page<OrderResponse> findByBuyerAccountId(UUID buyerAccountId, Pageable pageable) {
        return orderRepository.findByBuyerAccountId(buyerAccountId.toString(), pageable)
                .map(OrderMapper::toOrderResponse);
    }

    @Override
    public Page<OrderResponse> findBySellerAccountId(UUID sellerAccountId, Pageable pageable) {
        return orderRepository.findBySellerAccountId(sellerAccountId.toString(), pageable)
                .map(OrderMapper::toOrderResponse);
    }

    private void validateCostumerAccount(UUID customerAccountId) {

        var accountResponse = accountServiceClient.findAccountById(customerAccountId);

        if (accountResponse.getRole() != AccountRole.BUYER) {
            throw new ValidationErrorException("account is not a customer. Only costumers account can create new orders");
        }
    }
}