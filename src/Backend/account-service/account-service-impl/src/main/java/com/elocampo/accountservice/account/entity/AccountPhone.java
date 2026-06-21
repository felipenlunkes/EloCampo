package com.elocampo.accountservice.account.entity;

import lombok.Data;

@Data
public class AccountPhone {

    private Integer countryCode;
    private Integer stateCode;
    private String number;
}
