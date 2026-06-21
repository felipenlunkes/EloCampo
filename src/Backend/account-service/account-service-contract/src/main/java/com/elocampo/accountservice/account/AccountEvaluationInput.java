package com.elocampo.accountservice.account;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class AccountEvaluationInput {

    @NotNull(message = "stars is required")
    @Min(value = 1, message = "stars must be at least 1")
    @Max(value = 5, message = "stars must be at most 5")
    private Integer stars;

    @NotNull(message = "reviewerAccountId is required")
    private UUID reviewerAccountId;

    @NotNull(message = "productId is required")
    private UUID productId;

    @Size(max = 280, message = "content cannot exceed 280 characters")
    private String content;
}
