package com.elocampo.productservice.product.controller;

import com.elocampo.productservice.dto.ProductFilter;
import com.elocampo.productservice.product.ProductCategory;
import com.elocampo.productservice.product.ProductEvaluationInput;
import com.elocampo.productservice.product.ProductInput;
import com.elocampo.productservice.product.ProductResponse;
import com.elocampo.productservice.product.service.ProductService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(@RequestBody ProductInput request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProductResponse>> findAll() {

        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> findById(@PathVariable @NotNull UUID id) {
        return productService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable @NotNull UUID id, @RequestBody ProductInput request) {
        return ResponseEntity.status(HttpStatus.OK).body(productService.update(id, request));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> findAllByRemovedFalse() {
        return ResponseEntity.status(HttpStatus.OK).body(productService.findAllByRemovedFalse());
    }

    @GetMapping("/query")
    public ResponseEntity<List<ProductResponse>> findByFilter(
            @RequestParam(required = false) String description,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) String vendorCity,
            @RequestParam(required = false) String vendorState
    ) {

        var filters = new ProductFilter(description, category, vendorCity, vendorState);
        return ResponseEntity.status(HttpStatus.OK).body(productService.findByFilter(filters));
    }

    @GetMapping("/vendor/{vendorAccountId}")
    public ResponseEntity<List<ProductResponse>> findByVendorAccountId(@PathVariable @NotNull UUID vendorAccountId) {
        return ResponseEntity.ok(productService.findByVendorAccountId(vendorAccountId));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable UUID id) {
        productService.activate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<ProductResponse> evaluate(@PathVariable @NotNull UUID id, @RequestBody ProductEvaluationInput request) {
        return productService.evaluate(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
