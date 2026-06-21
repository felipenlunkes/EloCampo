package com.elocampo.productservice.product.mapper;

import com.elocampo.productservice.product.ProductCategory;
import com.elocampo.productservice.product.ProductScale;
import com.elocampo.productservice.product.ProductStatus;
import com.elocampo.productservice.product.entity.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    @Test
    void toProductResponseMapsAllFields() {

        var id = UUID.randomUUID();
        var vendorAccountId = UUID.randomUUID();
        var availabilityDate = Instant.parse("2026-06-01T00:00:00Z");
        var createdAt = Instant.parse("2026-01-10T10:00:00Z");
        var updatedAt = Instant.parse("2026-03-15T12:00:00Z");

        var product = Product.builder()
                .id(id.toString())
                .vendorAccountId(vendorAccountId.toString())
                .description("Tomate orgânico cereja")
                .category(ProductCategory.VEGETABLE)
                .status(ProductStatus.AVAILABLE)
                .scale(ProductScale.KG)
                .price(new BigDecimal("12.50"))
                .vendorCity("Belo Horizonte")
                .vendorState("MG")
                .availabilityDate(availabilityDate)
                .imageUrls(List.of("https://example.com/img1.jpg", "https://example.com/img2.jpg"))
                .removed(false)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();

        var result = ProductMapper.toProductResponse(product);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getVendorAccountId()).isEqualTo(vendorAccountId);
        assertThat(result.getDescription()).isEqualTo("Tomate orgânico cereja");
        assertThat(result.getCategory()).isEqualTo(ProductCategory.VEGETABLE);
        assertThat(result.getStatus()).isEqualTo(ProductStatus.AVAILABLE);
        assertThat(result.getScale()).isEqualTo(ProductScale.KG);
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("12.50"));
        assertThat(result.getVendorCity()).isEqualTo("Belo Horizonte");
        assertThat(result.getVendorState()).isEqualTo("MG");
        assertThat(result.getAvailabilityDate()).isEqualTo(availabilityDate.toEpochMilli());
        assertThat(result.getImageUrls()).containsExactly("https://example.com/img1.jpg", "https://example.com/img2.jpg");
        assertThat(result.getCreatedAt()).isEqualTo(createdAt.toEpochMilli());
        assertThat(result.getUpdatedAt()).isEqualTo(updatedAt.toEpochMilli());
    }

    @Test
    void toProductResponseWithNullImageUrlsMapsNull() {

        var id = UUID.randomUUID();
        var vendorAccountId = UUID.randomUUID();
        var now = Instant.now();

        var product = Product.builder()
                .id(id.toString())
                .vendorAccountId(vendorAccountId.toString())
                .description("Leite integral")
                .category(ProductCategory.DAIRY)
                .status(ProductStatus.AVAILABLE)
                .scale(ProductScale.LITER)
                .price(new BigDecimal("5.00"))
                .vendorCity("São Paulo")
                .vendorState("SP")
                .availabilityDate(now)
                .imageUrls(null)
                .removed(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var result = ProductMapper.toProductResponse(product);

        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getImageUrls()).isNull();
    }

    @Test
    void toProductResponseMapsCorrectEpochMilliConversion() {

        var id = UUID.randomUUID();
        var vendorAccountId = UUID.randomUUID();
        var fixedInstant = Instant.ofEpochMilli(1_700_000_000_000L);

        var product = Product.builder()
                .id(id.toString())
                .vendorAccountId(vendorAccountId.toString())
                .description("Frango caipira")
                .category(ProductCategory.PROTEINS)
                .status(ProductStatus.AVAILABLE)
                .scale(ProductScale.KG)
                .price(new BigDecimal("30.00"))
                .vendorCity("Curitiba")
                .vendorState("PR")
                .availabilityDate(fixedInstant)
                .imageUrls(List.of())
                .removed(false)
                .createdAt(fixedInstant)
                .updatedAt(fixedInstant)
                .build();

        var result = ProductMapper.toProductResponse(product);

        assertThat(result.getAvailabilityDate()).isEqualTo(1_700_000_000_000L);
        assertThat(result.getCreatedAt()).isEqualTo(1_700_000_000_000L);
        assertThat(result.getUpdatedAt()).isEqualTo(1_700_000_000_000L);
    }
}