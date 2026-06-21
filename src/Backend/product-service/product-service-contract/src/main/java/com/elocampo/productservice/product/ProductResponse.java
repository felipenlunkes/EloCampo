package com.elocampo.productservice.product;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
public class ProductResponse {

    private UUID id;
    private UUID vendorAccountId;
    private String description;
    private ProductCategory category;
    private ProductStatus status;
    private ProductScale scale;
    private Long quantity;
    private BigDecimal price;
    private String vendorCity;
    private String vendorState;
    private Long availabilityDate;
    private List<String> imageUrls;
    private Long createdAt;
    private Long updatedAt;
    private Set<ProductEvaluationResponse> evaluations;
}
