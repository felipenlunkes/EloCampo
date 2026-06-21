package com.elocampo.productservice.product.repository;

import com.elocampo.productservice.dto.ProductFilter;
import com.elocampo.productservice.product.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ProductQueryRepository {

    private final MongoTemplate mongoTemplate;

    public List<Product> findByFilter(ProductFilter filter) {
        var criteria = new ArrayList<Criteria>();

        criteria.add(Criteria.where("removed").is(false));

        if (filter.description() != null && !filter.description().isBlank()) {
            criteria.add(Criteria.where("description").regex(filter.description(), "i"));
        }

        if (filter.category() != null) {
            criteria.add(Criteria.where("category").is(filter.category()));
        }

        if (filter.vendorCity() != null) {
            criteria.add(Criteria.where("vendorCity").is(filter.vendorCity()));
        }

        if (filter.vendorState() != null) {
            criteria.add(Criteria.where("vendorState").is(filter.vendorState()));
        }

        var query = new Query(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        return mongoTemplate.find(query, Product.class);
    }

}
