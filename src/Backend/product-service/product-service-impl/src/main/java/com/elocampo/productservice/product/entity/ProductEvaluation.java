package com.elocampo.productservice.product.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.util.UUID;

@Builder
@Data
public class ProductEvaluation {

    @Field(targetType = FieldType.STRING)
    private UUID id;

    private Integer stars;
    private String content;

    @Field(targetType = FieldType.STRING)
    private UUID reviewAccountId;
}
