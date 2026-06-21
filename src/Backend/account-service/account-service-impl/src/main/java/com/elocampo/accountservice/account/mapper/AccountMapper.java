package com.elocampo.accountservice.account.mapper;

import com.elocampo.accountservice.account.*;
import com.elocampo.accountservice.account.entity.Account;
import com.elocampo.accountservice.account.entity.AccountAddress;
import com.elocampo.accountservice.account.entity.AccountEvaluation;
import com.elocampo.accountservice.account.entity.AccountPhone;

import java.util.UUID;
import java.util.stream.Collectors;

public class AccountMapper {

    public static AccountAddress toAccountAddress(AccountAddressInput input) {

        var accountAddress = new AccountAddress();

        accountAddress.setStreet(input.getStreet());
        accountAddress.setNumber(input.getNumber());
        accountAddress.setCity(input.getCity());
        accountAddress.setState(input.getState());
        accountAddress.setDistrict(input.getDistrict());
        accountAddress.setComplement(input.getComplement());
        accountAddress.setPostalCode(input.getPostalCode());

        return accountAddress;
    }

    public static AccountPhone toAccountPhone(AccountPhoneInput input) {

        var accountPhone = new AccountPhone();

        accountPhone.setNumber(input.getNumber());
        accountPhone.setStateCode(input.getStateCode());
        accountPhone.setCountryCode(input.getCountryCode());

        return accountPhone;
    }

    public static AccountResponse toAccountResponse(Account account) {

        var accountResponse = new AccountResponse();

        accountResponse.setId(UUID.fromString(account.getId()));
        accountResponse.setName(account.getName());
        accountResponse.setUserId(UUID.fromString(account.getUserId()));
        accountResponse.setCpf(account.getCpf());
        accountResponse.setCnpj(account.getCnpj());
        accountResponse.setRole(account.getRole());
        accountResponse.setAddress(toAddressResponse(account.getAddress()));
        accountResponse.setPhone(toPhoneResponse(account.getPhone()));
        accountResponse.setBirthdayDate(account.getBirthdayDate().toEpochMilli());
        accountResponse.setCreatedAt(account.getCreatedAt().toEpochMilli());
        accountResponse.setUpdatedAt(account.getUpdatedAt().toEpochMilli());

        if (account.getEvaluation() != null && !account.getEvaluation().isEmpty()) {

            var evaluationSet = account.getEvaluation().stream().map(AccountMapper::toAccountEvaluationResponse).collect(Collectors.toSet());
            accountResponse.setEvaluation(evaluationSet);
        }

        return accountResponse;
    }

    private static AccountAddressResponse toAddressResponse(AccountAddress accountAddress) {

        var addressResponse = new AccountAddressResponse();

        addressResponse.setStreet(accountAddress.getStreet());
        addressResponse.setNumber(accountAddress.getNumber());
        addressResponse.setDistrict(accountAddress.getDistrict());
        addressResponse.setCity(accountAddress.getCity());
        addressResponse.setState(accountAddress.getState());
        addressResponse.setComplement(accountAddress.getComplement());
        addressResponse.setPostalCode(accountAddress.getPostalCode());

        return addressResponse;
    }

    private static AccountPhoneResponse toPhoneResponse(AccountPhone accountPhone) {

        var phoneResponse = new AccountPhoneResponse();

        phoneResponse.setNumber(accountPhone.getNumber());
        phoneResponse.setStateCode(accountPhone.getStateCode());
        phoneResponse.setCountryCode(accountPhone.getCountryCode());

        return phoneResponse;
    }
    public static AccountEvaluationResponse toAccountEvaluationResponse(AccountEvaluation input) {

        var evaluationResponse = new AccountEvaluationResponse();

        evaluationResponse.setId(input.getId());
        evaluationResponse.setStars(input.getStars());
        evaluationResponse.setContent(input.getContent());
        evaluationResponse.setReviewerAccountId(input.getReviewAccountId());
        evaluationResponse.setProductId(input.getProductId());

        return evaluationResponse;
    }
}
