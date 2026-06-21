package com.elocampo.productservice.product;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Builder
@Data
public class ProductEvaluationResponse {

    private UUID id;
    private Integer stars;
    private String content;
    private UUID productId;
}
