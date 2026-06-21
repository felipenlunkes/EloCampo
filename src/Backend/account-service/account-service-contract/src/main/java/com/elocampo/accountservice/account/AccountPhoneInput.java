package com.elocampo.accountservice.account;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountPhoneInput {

    @NotNull(message = "countryCode is required")
    private Integer countryCode;

    @NotNull(message = "stateCode")
    private Integer stateCode;

    @NotNull(message = "number")
    private String number;
}
