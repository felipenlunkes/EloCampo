package com.elocampo.productservice.product.service;

import com.elocampo.productservice.dto.ProductFilter;
import com.elocampo.productservice.product.ProductEvaluationInput;
import com.elocampo.productservice.product.ProductInput;
import com.elocampo.productservice.product.ProductResponse;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductService {

    ProductResponse create(@Valid ProductInput request);

    ProductResponse update(UUID productId, @Valid ProductInput request);

    Optional<ProductResponse> evaluate(UUID accountId, @Valid ProductEvaluationInput request);

    List<ProductResponse> findAll();

    Optional<ProductResponse> findById(UUID productId);

    List<ProductResponse> findAllByRemovedFalse();

    List<ProductResponse> findByFilter(ProductFilter filter);

    List<ProductResponse> findByVendorAccountId(UUID vendorAccountId);

    void deactivate(UUID productId);

    void activate(UUID productId);
}
