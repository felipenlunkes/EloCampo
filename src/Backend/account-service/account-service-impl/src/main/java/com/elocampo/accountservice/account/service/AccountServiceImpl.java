package com.elocampo.accountservice.account.service;

import com.elocampo.accountservice.account.AccountEvaluationInput;
import com.elocampo.accountservice.account.AccountInput;
import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.entity.AccountEvaluation;
import com.elocampo.accountservice.config.client.AuthServiceClient;
import com.elocampo.accountservice.config.client.MessageServiceClient;
import com.elocampo.accountservice.exceptions.NotFoundException;
import com.elocampo.accountservice.account.entity.Account;
import com.elocampo.accountservice.account.mapper.AccountMapper;
import com.elocampo.accountservice.account.repository.AccountRepository;
import com.elocampo.accountservice.exceptions.ValidationErrorException;
import com.elocampo.accountservice.util.UuidV7;
import com.elocampo.authservice.user.UserResponse;
import com.elocampo.messageservice.email.EmailInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.List;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
@Validated
@Slf4j
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final AuthServiceClient authServiceClient;
    private final MessageServiceClient messageServiceClient;

    @Override
    @Transactional
    public AccountResponse create(AccountInput request) {

        var userResponse = validateAccountCreation(request);

        var now = Instant.now();

        var accountEntity = Account.builder()
                .id(UuidV7.generate().toString())
                .name(request.getName())
                .userId(request.getUserId().toString())
                .cpf(request.getCpf())
                .cnpj(request.getCnpj())
                .birthdayDate(Instant.ofEpochMilli(request.getBirthdayDate()))
                .address(AccountMapper.toAccountAddress(request.getAddress()))
                .phone(AccountMapper.toAccountPhone(request.getPhone()))
                .role(request.getRole())
                .active(true)
                .removed(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        var accountSaved = accountRepository.save(accountEntity);
        var accountResponse = AccountMapper.toAccountResponse(accountSaved);

        log.info("Account created: {}", accountResponse);

        sendNewAccountEmail(accountResponse, userResponse);

        return accountResponse;
    }

    @Override
    @Transactional
    public AccountResponse update(UUID accountId, AccountInput request) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        commonValidations(request);

        var accountFound = accountRepository.findByIdAndRemovedFalse(accountId.toString());

        if (accountFound.isEmpty()) {
            throw new NotFoundException("account not found by id");
        }

        var accountEntity = accountFound.get();

        validateAccountUpdate(request, accountEntity);

        var accountBefore = AccountMapper.toAccountResponse(accountEntity);

        var now = Instant.now();

        accountEntity.setName(request.getName());
        accountEntity.setAddress(AccountMapper.toAccountAddress(request.getAddress()));
        accountEntity.setPhone(AccountMapper.toAccountPhone(request.getPhone()));
        accountEntity.setUpdatedAt(now);

        var accountSaved = accountRepository.save(accountEntity);
        var accountResponse = AccountMapper.toAccountResponse(accountSaved);

        log.info("Account updated: (before={}, after={})", accountBefore, accountResponse);

        return accountResponse;
    }

    @Override
    public Optional<AccountResponse> findById(UUID accountId) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        return accountRepository.findByIdAndRemovedFalse(accountId.toString()).map(AccountMapper::toAccountResponse);
    }

    @Override
    public List<AccountResponse> findAll() {

        var accountList =  accountRepository.findAll();

        return accountList.stream().map(AccountMapper::toAccountResponse).toList();
    }

    @Override
    public Optional<AccountResponse> findByUserId(UUID userId) {

        if (userId == null) {
            throw new ValidationErrorException("userId is required");
        }

        return accountRepository.findByUserIdAndRemovedFalse(userId.toString()).map(AccountMapper::toAccountResponse);
    }

    @Override
    @Transactional
    public void deactivate(UUID accountId) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        var accountFound = accountRepository.findByIdAndRemovedFalse(accountId.toString());

        if (accountFound.isEmpty()) {
            throw new NotFoundException("User not found");
        }

        accountFound.ifPresent(account -> {
            account.setRemoved(true);
            account.setUpdatedAt(Instant.now());
            accountRepository.save(account);

            try {
                var userResponse = findAccountUserById(UUID.fromString(account.getUserId()));
                sendDeactivatedAccountMail(AccountMapper.toAccountResponse(account), userResponse);
            } catch (Exception exception) {
                log.error("Error sending deactivated account email (id={}). The account is deactivated anyway", account.getId());
            }
        });

        log.info("Account deactivated: {}", accountFound.get());
    }

    @Override
    @Transactional
    public void activate(UUID accountId) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        var accountFound = accountRepository.findById(accountId.toString());

        if (accountFound.isEmpty()) {
            throw new NotFoundException("User not found");
        }

        if (!accountFound.get().getRemoved()) {
            throw new ValidationErrorException("account already active. Cannot activate an active account");
        }

        accountFound.ifPresent(account -> {
            account.setRemoved(false);
            account.setUpdatedAt(Instant.now());
            accountRepository.save(account);
        });

        log.info("Account activated: {}", accountFound.get());
    }

    private void commonValidations(AccountInput request) {

        if (isBlank(request.getCpf()) && isBlank(request.getCnpj())) {
            throw new ValidationErrorException("cpf or cnpj is required");
        }

        if (!isBlank(request.getCpf()) && !isBlank(request.getCnpj())) {
            throw new ValidationErrorException("cpf and cnpj are mutually exclusive");
        }
    }

    private void validateAccountUpdate(AccountInput request, Account account) {

        commonValidations(request);

        if (!isBlank(request.getCpf())) {
            var accountFoundByCpf = accountRepository.findByCpfAndRemovedFalse(request.getCpf());

            if (accountFoundByCpf.isPresent() && !accountFoundByCpf.get().getId().equals(account.getId())) {
                throw new ValidationErrorException("An account already exists for this cpf");
            }
        } else if (!isBlank(request.getCnpj())) {
            var accountFoundByCnpj = accountRepository.findByCnpjAndRemovedFalse(request.getCnpj());

            if (accountFoundByCnpj.isPresent() && !accountFoundByCnpj.get().getId().equals(account.getId())) {
                throw new ValidationErrorException("An account already exists for this cnpj");
            }
        }

    }

    private UserResponse validateAccountCreation(AccountInput request) {

        commonValidations(request);

        var accountFoundByUserId = accountRepository.findByUserIdAndRemovedFalse(request.getUserId().toString());

        if (accountFoundByUserId.isPresent()) {
            throw new ValidationErrorException("The user already had an account. Cannot create another one");
        }

        if (!isBlank(request.getCpf())) {
            var accountFoundByCpf = accountRepository.findByCpfAndRemovedFalse(request.getCpf());

            if (accountFoundByCpf.isPresent()) {
                throw new ValidationErrorException("An account already exists for this cpf");
            }
        } else if (!isBlank(request.getCnpj())) {
            var accountFoundByCnpj = accountRepository.findByCnpjAndRemovedFalse(request.getCnpj());

            if (accountFoundByCnpj.isPresent()) {
                throw new ValidationErrorException("An account already exists for this cnpj");
            }
        }

        return findAccountUserById(request.getUserId());
    }

    private UserResponse findAccountUserById(UUID userId) {

        return authServiceClient.findUserById(userId);
    }

    private void sendDeactivatedAccountMail(AccountResponse accountResponse, UserResponse user) {

        var subject = "Conta desativada - EloCampo";
        var body = "Olá! Gostaríamos de informar que sua conta foi desativada no EloCampo e não pode mais ser acessada."
                   + " Entre em contato com um administrador da plataforma";

        sendEmail(user.email(), subject, body);

        log.info("Deactivate account email sent successfully to account (id={}, userEmail={}", accountResponse.getId(), user.email());
    }

    private void sendNewAccountEmail(AccountResponse accountResponse, UserResponse user) {

        var name = !isBlank(accountResponse.getName()) ? accountResponse.getName() : accountResponse.getBusinessName();

        var subject = String.format("Seja bem-vindo(a) ao EloCampo, %s", name);
        var body = "Olá! Seja bem-vindo(a) ao EloCampo! Esperamos que tenha uma excelente experiência com a plataforma!";

        sendEmail(user.email(), subject, body);

        log.info("New account email sent successfully to account (id={}, userEmail={}", accountResponse.getId(), user.email());
    }

    private void sendEmail(String to, String subject, String body) {

        var emailInput = new EmailInput();
        emailInput.setTo(to);
        emailInput.setSubject(subject);
        emailInput.setBody(body);

        messageServiceClient.send(emailInput);
    }

    @Transactional
    @Override
    public Optional<AccountResponse> evaluate(UUID accountId, AccountEvaluationInput request) {

        if (accountId == null) {
            throw new ValidationErrorException("accountId is required");
        }

        var account = accountRepository.findByIdAndRemovedFalse(accountId.toString())
                .orElseThrow(() -> new NotFoundException("account not found by id"));

        var evaluation = AccountEvaluation.builder()
                .id(UUID.randomUUID())
                .stars(request.getStars())
                .content(request.getContent())
                .productId(request.getProductId())
                .reviewAccountId(request.getReviewerAccountId())
                .build();

        if (account.getEvaluation() == null || account.getEvaluation().isEmpty()) {
            account.setEvaluation(new HashSet<>());
        }

        account.getEvaluation().add(evaluation);

        var accountEvaluationValue = account.getEvaluation().stream().mapToInt(AccountEvaluation::getStars).sum();
        var accountEvaluationMean = accountEvaluationValue / account.getEvaluation().size();

        accountRepository.save(account);

        log.info("Account evaluation created: (accountId={}, evaluation={}, evaluationMean={})", accountId, evaluation, accountEvaluationMean);

        return Optional.of(AccountMapper.toAccountResponse(account));
    }

}
