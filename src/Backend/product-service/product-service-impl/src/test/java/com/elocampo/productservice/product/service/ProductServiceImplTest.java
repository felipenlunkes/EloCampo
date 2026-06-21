package com.elocampo.productservice.product.service;

import com.elocampo.accountservice.account.AccountAddressResponse;
import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.productservice.config.client.AccountServiceClient;
import com.elocampo.productservice.exceptions.NotFoundException;
import com.elocampo.productservice.exceptions.ValidationErrorException;
import com.elocampo.productservice.product.ProductCategory;
import com.elocampo.productservice.product.ProductInput;
import com.elocampo.productservice.product.ProductScale;
import com.elocampo.productservice.product.ProductStatus;
import com.elocampo.productservice.product.entity.Product;
import com.elocampo.productservice.product.repository.ProductQueryRepository;
import com.elocampo.productservice.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductQueryRepository productQueryRepository;

    @Mock
    private AccountServiceClient accountServiceClient;

    @InjectMocks
    private ProductServiceImpl productService;

    private UUID productId;
    private UUID vendorAccountId;
    private ProductInput validInput;
    private Product existingProduct;
    private AccountResponse vendorAccountResponse;

    @BeforeEach
    void setUp() {

        productId = UUID.randomUUID();
        vendorAccountId = UUID.randomUUID();

        validInput = new ProductInput();
        validInput.setVendorAccountId(vendorAccountId);
        validInput.setDescription("Tomate orgânico");
        validInput.setCategory(ProductCategory.VEGETABLE);
        validInput.setScale(ProductScale.KG);
        validInput.setPrice(new BigDecimal("12.50"));
        validInput.setAvailabilityDate(Instant.now().toEpochMilli());
        validInput.setImageUrls(List.of("https://example.com/img.jpg"));

        existingProduct = Product.builder()
                .id(productId.toString())
                .vendorAccountId(vendorAccountId.toString())
                .description("Tomate orgânico")
                .category(ProductCategory.VEGETABLE)
                .status(ProductStatus.AVAILABLE)
                .scale(ProductScale.KG)
                .price(new BigDecimal("12.50"))
                .vendorCity("Belo Horizonte")
                .vendorState("MG")
                .availabilityDate(Instant.now())
                .imageUrls(List.of("https://example.com/img.jpg"))
                .removed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        var address = new AccountAddressResponse();
        address.setCity("Belo Horizonte");
        address.setState("MG");

        vendorAccountResponse = new AccountResponse();
        vendorAccountResponse.setId(vendorAccountId);
        vendorAccountResponse.setRole(AccountRole.VENDOR);
        vendorAccountResponse.setAddress(address);
    }

    @Test
    void createSavesAndReturnsResponse() {

        when(accountServiceClient.findAccountById(vendorAccountId)).thenReturn(vendorAccountResponse);
        when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

        var result = productService.create(validInput);

        assertThat(result).isNotNull();
        assertThat(result.getDescription()).isEqualTo("Tomate orgânico");
        assertThat(result.getVendorAccountId()).isEqualTo(vendorAccountId);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createWhenAccountIsNotVendorThrowsValidationErrorException() {

        vendorAccountResponse.setRole(AccountRole.BUYER);
        when(accountServiceClient.findAccountById(vendorAccountId)).thenReturn(vendorAccountResponse);

        assertThatThrownBy(() -> productService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("account is not a vendor");

        verify(productRepository, never()).save(any());
    }

    @Test
    void updateWithValidIdSavesAndReturnsResponse() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

        var result = productService.update(productId, validInput);

        assertThat(result).isNotNull();
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void updateWithNullProductIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> productService.update(null, validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("productId is required");

        verify(productRepository, never()).findByIdAndRemovedFalse(anyString());
    }

    @Test
    void updateWhenProductNotFoundThrowsNotFoundException() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.update(productId, validInput))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("product not found by id");
    }

    @Test
    void findByIdWhenFoundReturnsPresent() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.of(existingProduct));

        var result = productService.findById(productId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(productId);
    }

    @Test
    void findByIdWhenNotFoundReturnsEmpty() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.empty());

        var result = productService.findById(productId);

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdWithNullIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> productService.findById(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("productId is required");
    }

    @Test
    void findAllByRemovedFalseReturnsProductList() {

        when(productRepository.findAllByRemovedFalse()).thenReturn(List.of(existingProduct));

        var result = productService.findAllByRemovedFalse();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getId()).isEqualTo(productId);
    }

    @Test
    void findAllByRemovedFalseReturnsEmptyListWhenNoneFound() {

        when(productRepository.findAllByRemovedFalse()).thenReturn(List.of());

        var result = productService.findAllByRemovedFalse();

        assertThat(result).isEmpty();
    }

    @Test
    void findByVendorAccountIdReturnsProductList() {

        when(productRepository.findByVendorAccountIdAndRemovedFalse(vendorAccountId.toString()))
                .thenReturn(List.of(existingProduct));

        var result = productService.findByVendorAccountId(vendorAccountId);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getVendorAccountId()).isEqualTo(vendorAccountId);
    }

    @Test
    void findByVendorAccountIdWithNullIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> productService.findByVendorAccountId(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("vendorAccountId is required");
    }

    @Test
    void deactivateSetsRemovedTrueAndSaves() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

        assertThatNoException().isThrownBy(() -> productService.deactivate(productId));

        assertThat(existingProduct.getRemoved()).isTrue();
        verify(productRepository).save(existingProduct);
    }

    @Test
    void deactivateWithNullProductIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> productService.deactivate(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("productId is required");
    }

    @Test
    void deactivateWhenProductNotFoundThrowsNotFoundException() {

        when(productRepository.findByIdAndRemovedFalse(productId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.deactivate(productId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void activateSetsRemovedFalseAndSaves() {

        existingProduct.setRemoved(true);
        when(productRepository.findById(productId.toString())).thenReturn(Optional.of(existingProduct));
        when(productRepository.save(any(Product.class))).thenReturn(existingProduct);

        assertThatNoException().isThrownBy(() -> productService.activate(productId));

        assertThat(existingProduct.getRemoved()).isFalse();
        verify(productRepository).save(existingProduct);
    }

    @Test
    void activateWithNullProductIdThrowsValidationErrorException() {

        assertThatThrownBy(() -> productService.activate(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("productId is required");
    }

    @Test
    void activateWhenProductNotFoundThrowsNotFoundException() {

        when(productRepository.findById(productId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.activate(productId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void activateWhenProductAlreadyActiveThrowsValidationErrorException() {

        existingProduct.setRemoved(false);
        when(productRepository.findById(productId.toString())).thenReturn(Optional.of(existingProduct));

        assertThatThrownBy(() -> productService.activate(productId))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("product already active");
    }
}