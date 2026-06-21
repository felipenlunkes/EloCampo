package com.elocampo.orderservice.order.controller;

import com.elocampo.orderservice.order.OrderInput;
import com.elocampo.orderservice.order.OrderResponse;
import com.elocampo.orderservice.order.OrderStatusChangeInput;
import com.elocampo.orderservice.order.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderInput request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> findAll() {
        return ResponseEntity.ok(orderService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> findById(@PathVariable @NotNull UUID id) {
        return orderService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable UUID id, @Valid @RequestBody OrderStatusChangeInput request) {
        orderService.changeStatus(id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buyer/{buyerAccountId}")
    public ResponseEntity<Page<OrderResponse>> findByBuyer(@PathVariable UUID buyerAccountId,
                                                           @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(orderService.findByBuyerAccountId(buyerAccountId, pageable));
    }

    @GetMapping("/seller/{sellerAccountId}")
    public ResponseEntity<Page<OrderResponse>> findBySeller(@PathVariable UUID sellerAccountId,
                                                            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(orderService.findBySellerAccountId(sellerAccountId, pageable));
    }
}
