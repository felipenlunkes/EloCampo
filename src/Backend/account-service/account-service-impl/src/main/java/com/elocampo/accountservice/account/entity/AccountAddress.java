package com.elocampo.accountservice.account.entity;

import lombok.Data;

@Data
public class AccountAddress {

    private String street;
    private String number;
    private String city;
    private String district;
    private String state;
    private String complement;
    private String postalCode;
}
