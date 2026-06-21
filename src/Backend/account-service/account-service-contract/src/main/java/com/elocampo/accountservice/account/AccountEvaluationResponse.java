package com.elocampo.accountservice.account;

import lombok.Data;

import java.util.UUID;

@Data
public class AccountEvaluationResponse {

    private UUID id;
    private Integer stars;
    private String content;
    private UUID reviewerAccountId;
    private UUID productId;
}
