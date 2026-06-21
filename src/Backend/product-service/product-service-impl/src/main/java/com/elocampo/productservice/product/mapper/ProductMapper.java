package com.elocampo.productservice.product.mapper;

import com.elocampo.productservice.product.ProductEvaluationResponse;
import com.elocampo.productservice.product.ProductResponse;
import com.elocampo.productservice.product.entity.Product;
import com.elocampo.productservice.product.entity.ProductEvaluation;

import java.util.UUID;
import java.util.stream.Collectors;

public class ProductMapper {

    public static ProductResponse toProductResponse(Product product) {

        var productResponse = new ProductResponse();

        productResponse.setId(UUID.fromString(product.getId()));
        productResponse.setVendorAccountId(UUID.fromString(product.getVendorAccountId()));
        productResponse.setDescription(product.getDescription());
        productResponse.setCategory(product.getCategory());
        productResponse.setStatus(product.getStatus());
        productResponse.setScale(product.getScale());
        productResponse.setQuantity(product.getQuantity());
        productResponse.setPrice(product.getPrice());
        productResponse.setVendorCity(product.getVendorCity());
        productResponse.setVendorState(product.getVendorState());
        productResponse.setAvailabilityDate(product.getAvailabilityDate().toEpochMilli());
        productResponse.setImageUrls(product.getImageUrls());
        productResponse.setCreatedAt(product.getCreatedAt().toEpochMilli());
        productResponse.setUpdatedAt(product.getUpdatedAt().toEpochMilli());

        if (product.getEvaluations() != null) {
            productResponse.setEvaluations(product.getEvaluations().stream().map(ProductMapper::toEvaluationResponse).collect(Collectors.toSet()));
        }

        return productResponse;
    }

    private static ProductEvaluationResponse toEvaluationResponse(ProductEvaluation input) {

        return ProductEvaluationResponse.builder()
                .id(input.getId())
                .stars(input.getStars())
                .content(input.getContent())
                .build();
    }
}
