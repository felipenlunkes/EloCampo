package com.elocampo.productservice.product.entity;

import com.elocampo.productservice.product.ProductCategory;
import com.elocampo.productservice.product.ProductScale;
import com.elocampo.productservice.product.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "product")
public class Product {

    @Id
    private String id;

    @Indexed
    private String vendorAccountId;
    private String description;
    private ProductStatus status;
    private ProductCategory category;
    private ProductScale scale;
    private Long quantity;
    private BigDecimal price;
    private String vendorCity;
    private String vendorState;
    private Instant availabilityDate;
    private List<String> imageUrls;
    private Set<ProductEvaluation> evaluations;
    private Boolean removed;
    private Instant createdAt;
    private Instant updatedAt;
}
