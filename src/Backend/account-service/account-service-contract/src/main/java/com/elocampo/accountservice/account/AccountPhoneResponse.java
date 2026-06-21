package com.elocampo.accountservice.account;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountPhoneResponse {

    private Integer countryCode;
    private Integer stateCode;
    private String number;
}
