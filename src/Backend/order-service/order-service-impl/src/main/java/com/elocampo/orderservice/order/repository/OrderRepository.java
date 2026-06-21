package com.elocampo.orderservice.order.repository;

import com.elocampo.orderservice.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {

    Optional<Order> findById(String id);

    Page<Order> findByBuyerAccountId(String buyerAccountId, Pageable pageable);

    Page<Order> findBySellerAccountId(String sellerAccountId, Pageable pageable);
}
