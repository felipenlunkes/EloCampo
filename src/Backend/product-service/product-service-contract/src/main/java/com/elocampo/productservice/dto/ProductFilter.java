package com.elocampo.productservice.dto;

import com.elocampo.productservice.product.ProductCategory;

public record ProductFilter(
        String description,
        ProductCategory category,
        String vendorCity,
        String vendorState
        ) {}
