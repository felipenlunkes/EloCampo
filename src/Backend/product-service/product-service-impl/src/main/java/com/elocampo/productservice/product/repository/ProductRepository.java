package com.elocampo.productservice.product.repository;

import com.elocampo.productservice.product.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {

    Optional<Product> findByIdAndRemovedFalse(String id);

    List<Product> findAllByRemovedFalse();

    List<Product> findByVendorAccountIdAndRemovedFalse(String vendorAccountId);


}
