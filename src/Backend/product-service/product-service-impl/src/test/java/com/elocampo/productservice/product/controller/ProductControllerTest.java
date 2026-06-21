package com.elocampo.productservice.product.controller;

import com.elocampo.productservice.dto.ProductFilter;
import com.elocampo.productservice.product.ProductCategory;
import com.elocampo.productservice.product.ProductInput;
import com.elocampo.productservice.product.ProductResponse;
import com.elocampo.productservice.product.ProductScale;
import com.elocampo.productservice.product.ProductStatus;
import com.elocampo.productservice.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    private UUID productId;
    private UUID vendorAccountId;
    private ProductResponse productResponse;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        vendorAccountId = UUID.randomUUID();

        productResponse = new ProductResponse();
        productResponse.setId(productId);
        productResponse.setVendorAccountId(vendorAccountId);
        productResponse.setDescription("Tomate orgânico");
        productResponse.setCategory(ProductCategory.VEGETABLE);
        productResponse.setStatus(ProductStatus.AVAILABLE);
        productResponse.setScale(ProductScale.KG);
        productResponse.setPrice(new BigDecimal("12.50"));
        productResponse.setVendorCity("Belo Horizonte");

        productResponse.setVendorState("MG");
    }

    @Test
    void findAllByRemovedFalseShouldReturn200WithProductList() {
        when(productService.findAllByRemovedFalse()).thenReturn(List.of(productResponse));

        var response = productController.findAllByRemovedFalse();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotEmpty();
        assertThat(response.getBody()).containsExactly(productResponse);
    }

    @Test
    void findAllByRemovedFalseShouldReturn200WithEmptyList() {
        when(productService.findAllByRemovedFalse()).thenReturn(List.of());

        var response = productController.findAllByRemovedFalse();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void findByFilterShouldReturn200WithFilteredProducts() {
        var filter = new ProductFilter("Tomate", ProductCategory.VEGETABLE, "Belo Horizonte", "MG");
        when(productService.findByFilter(filter)).thenReturn(List.of(productResponse));

        var response = productController.findByFilter("Tomate", ProductCategory.VEGETABLE, "Belo Horizonte", "MG");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(productResponse);
    }

    @Test
    void findByFilterShouldReturn200WithEmptyListWhenNoMatch() {
        var filter = new ProductFilter("Inexistente", ProductCategory.FRUIT, "São Paulo", "SP");
        when(productService.findByFilter(filter)).thenReturn(List.of());

        var response = productController.findByFilter("Inexistente", ProductCategory.FRUIT, "São Paulo", "SP");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void findByFilterShouldReturn200WhenAllFiltersAreNull() {
        var filter = new ProductFilter(null, null, null, null);
        when(productService.findByFilter(filter)).thenReturn(List.of(productResponse));

        var response = productController.findByFilter(null, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(productResponse);
    }

    @Test
    void findByFilterShouldReturn200WithPartialFilters() {
        var filter = new ProductFilter(null, ProductCategory.VEGETABLE, null, null);
        when(productService.findByFilter(filter)).thenReturn(List.of(productResponse));

        var response = productController.findByFilter(null, ProductCategory.VEGETABLE, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(productResponse);
    }

    @Test
    void createShouldReturn201WithCreatedProduct() {
        var input = new ProductInput();
        when(productService.create(input)).thenReturn(productResponse);

        var response = productController.create(input);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(productResponse);
    }

    @Test
    void findByIdWhenFoundShouldReturn200() {
        when(productService.findById(productId)).thenReturn(Optional.of(productResponse));

        var response = productController.findById(productId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(productResponse);
    }

    @Test
    void findByIdWhenNotFoundShouldReturn404() {
        when(productService.findById(productId)).thenReturn(Optional.empty());

        var response = productController.findById(productId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNull();
    }

    @Test
    void updateShouldReturn200WithUpdatedProduct() {
        var input = new ProductInput();
        when(productService.update(productId, input)).thenReturn(productResponse);

        var response = productController.update(productId, input);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(productResponse);
    }

    @Test
    void findByVendorAccountIdShouldReturn200WithProductList() {
        when(productService.findByVendorAccountId(vendorAccountId)).thenReturn(List.of(productResponse));

        var response = productController.findByVendorAccountId(vendorAccountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsExactly(productResponse);
    }

    @Test
    void findByVendorAccountIdShouldReturn200WithEmptyList() {
        when(productService.findByVendorAccountId(vendorAccountId)).thenReturn(List.of());

        var response = productController.findByVendorAccountId(vendorAccountId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void deactivateShouldReturn204() {
        doNothing().when(productService).deactivate(productId);

        var response = productController.deactivate(productId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(productService).deactivate(productId);
    }

    @Test
    void activateShouldReturn204() {
        doNothing().when(productService).activate(productId);

        var response = productController.activate(productId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();
        verify(productService).activate(productId);
    }

}
