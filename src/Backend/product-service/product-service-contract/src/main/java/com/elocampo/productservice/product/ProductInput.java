package com.elocampo.productservice.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductInput {

    @NotNull(message = "vendorAccountId is required")
    private UUID vendorAccountId;

    @NotBlank(message = "description is required")
    @Size(max = 255, message = "description cannot be greater than 255 characters")
    private String description;

    @NotNull
    private ProductCategory category;

    @NotNull(message = "scale is required")
    private ProductScale scale;

    @NotNull(message = "quantity is required")
    private Long quantity;

    @NotNull(message = "price is required")
    @Positive(message = "price must be greater than zero")
    private BigDecimal price;

    @NotNull(message = "availabilityDate is required")
    private Long availabilityDate;

    private List<String> imageUrls;
}
