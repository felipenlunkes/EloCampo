package com.elocampo.accountservice.account;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountAddressInput {

    @NotNull(message = "street is required")
    private String street;

    @NotNull(message = "number is required")
    private String number;

    @NotNull(message = "city is required")
    private String city;

    @NotNull(message = "district is required")
    private String district;

    @NotNull(message = "state is required")
    private String state;

    @NotNull(message = "complement is requires")
    private String complement;

    @NotNull(message = "postalCode is required")
    private String postalCode;
}
