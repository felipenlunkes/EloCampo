package com.elocampo.productservice.product.service;

import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.productservice.dto.ProductFilter;
import com.elocampo.productservice.exceptions.NotFoundException;
import com.elocampo.productservice.exceptions.ValidationErrorException;
import com.elocampo.productservice.product.ProductEvaluationInput;
import com.elocampo.productservice.product.ProductInput;
import com.elocampo.productservice.product.ProductResponse;
import com.elocampo.productservice.product.ProductStatus;
import com.elocampo.productservice.product.entity.Product;
import com.elocampo.productservice.product.entity.ProductEvaluation;
import com.elocampo.productservice.product.mapper.ProductMapper;
import com.elocampo.productservice.product.repository.ProductQueryRepository;
import com.elocampo.productservice.product.repository.ProductRepository;
import com.elocampo.productservice.config.client.AccountServiceClient;
import com.elocampo.productservice.util.UuidV7;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Validated
@Slf4j
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductQueryRepository productQueryRepository;
    private final AccountServiceClient accountServiceClient;

    @Override
    @Transactional
    public ProductResponse create(ProductInput request) {

        validateVendorAccount(request.getVendorAccountId());

        var now = Instant.now();

        var account = findVendorAccount(request.getVendorAccountId());

        var productEntity = Product.builder()
                .id(UuidV7.generate().toString())
                .vendorAccountId(request.getVendorAccountId().toString())
                .description(request.getDescription())
                .status(ProductStatus.AVAILABLE)
                .category(request.getCategory())
                .scale(request.getScale())
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .vendorCity(account.getAddress().getCity())
                .vendorState(account.getAddress().getState())
                .availabilityDate(Instant.ofEpochMilli(request.getAvailabilityDate()))
                .imageUrls(request.getImageUrls())
                .removed(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var productSaved = productRepository.save(productEntity);
        var productResponse = ProductMapper.toProductResponse(productSaved);

        log.info("Product created: {}", productResponse);

        return productResponse;
    }

    @Override
    @Transactional
    public ProductResponse update(UUID productId, ProductInput request) {

        if (productId == null) {
            throw new ValidationErrorException("productId is required");
        }

        var productFound = productRepository.findByIdAndRemovedFalse(productId.toString());

        if (productFound.isEmpty()) {
            throw new NotFoundException("product not found by id");
        }

        var productEntity = productFound.get();

        var productBefore = ProductMapper.toProductResponse(productEntity);

        var now = Instant.now();

        productEntity.setDescription(request.getDescription());
        productEntity.setCategory(request.getCategory());
        productEntity.setScale(request.getScale());
        productEntity.setQuantity(request.getQuantity());
        productEntity.setPrice(request.getPrice());
        productEntity.setAvailabilityDate(Instant.ofEpochMilli(request.getAvailabilityDate()));
        productEntity.setImageUrls(request.getImageUrls());
        productEntity.setUpdatedAt(now);

        var productSaved = productRepository.save(productEntity);
        var productResponse = ProductMapper.toProductResponse(productSaved);

        log.info("Product updated: (before={}, after={})", productBefore, productResponse);

        return productResponse;
    }

    @Transactional
    @Override
    public Optional<ProductResponse> evaluate(UUID accountId, ProductEvaluationInput request) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        var product = productRepository.findByIdAndRemovedFalse(accountId.toString())
                .orElseThrow(() -> new NotFoundException("product not found by id"));

        var evaluation = ProductEvaluation.builder()
                .id(UUID.randomUUID())
                .stars(request.getStars())
                .content(request.getContent())
                .reviewAccountId(request.getReviewerAccountId()).build();

        if (product.getEvaluations() == null || product.getEvaluations().isEmpty()) {
            product.setEvaluations(new HashSet<>());
        }

        product.getEvaluations().add(evaluation);

        var accountEvaluationValue = product.getEvaluations().stream().mapToInt(ProductEvaluation::getStars).sum();
        var accountEvaluationMean = accountEvaluationValue / product.getEvaluations().size();

        productRepository.save(product);

        log.info("Product evaluation created: (productId={}, evaluation={}, evaluationMean={})", accountId, evaluation, accountEvaluationMean);

        return Optional.of(ProductMapper.toProductResponse(product));
    }

    @Override
    public List<ProductResponse> findAll() {

        var productList = productRepository.findAll();

        return productList.stream().map(ProductMapper::toProductResponse).toList();
    }

    @Override
    public Optional<ProductResponse> findById(UUID productId) {

        if (productId == null) {
            throw new ValidationErrorException("productId is required");
        }

        return productRepository.findByIdAndRemovedFalse(productId.toString()).map(ProductMapper::toProductResponse);
    }

    @Override
    public List<ProductResponse> findAllByRemovedFalse() {
        return productRepository.findAllByRemovedFalse()
                .stream()
                .map(ProductMapper::toProductResponse)
                .toList();
    }

    @Override
    public List<ProductResponse> findByFilter(ProductFilter filter) {
        return productQueryRepository.findByFilter(filter)
                .stream()
                .map(ProductMapper::toProductResponse)
                .toList();
    }


    @Override
    public List<ProductResponse> findByVendorAccountId(UUID vendorAccountId) {

        if (vendorAccountId == null) {
            throw new ValidationErrorException("vendorAccountId is required");
        }

        return productRepository.findByVendorAccountIdAndRemovedFalse(vendorAccountId.toString())
                .stream()
                .map(ProductMapper::toProductResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deactivate(UUID productId) {

        if (productId == null) {
            throw new ValidationErrorException("productId is required");
        }

        var productFound = productRepository.findByIdAndRemovedFalse(productId.toString());

        if (productFound.isEmpty()) {
            throw new NotFoundException("Product not found");
        }

        productFound.ifPresent(product -> {
            product.setRemoved(true);
            product.setUpdatedAt(Instant.now());
            productRepository.save(product);
        });

        log.info("Product deactivated: {}", productFound.get());
    }

    @Override
    @Transactional
    public void activate(UUID productId) {

        if (productId == null) {
            throw new ValidationErrorException("productId is required");
        }

        var productFound = productRepository.findById(productId.toString());

        if (productFound.isEmpty()) {
            throw new NotFoundException("Product not found");
        }

        if (!productFound.get().getRemoved()) {
            throw new ValidationErrorException("product already active. Cannot activate an active product");
        }

        productFound.ifPresent(product -> {
            product.setRemoved(false);
            product.setUpdatedAt(Instant.now());
            productRepository.save(product);
        });

        log.info("Product activated: {}", productFound.get());
    }

    private void validateVendorAccount(UUID vendorAccountId) {

        var accountResponse = accountServiceClient.findAccountById(vendorAccountId);

        if (accountResponse.getRole() != AccountRole.VENDOR) {
            throw new ValidationErrorException("account is not a vendor. Only vendor accounts can create products");
        }
    }

    private AccountResponse findVendorAccount(UUID vendorAccountId) {
        var accountResponse = accountServiceClient.findAccountById(vendorAccountId);

        if (accountResponse.getRole() != AccountRole.VENDOR) {
            throw new ValidationErrorException("account is not a vendor. Only vendor accounts can create products");
        }

        return accountResponse;
    }
}
