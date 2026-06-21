package com.elocampo.authservice.token.service;

import com.elocampo.authservice.token.TokenInput;
import com.elocampo.authservice.token.TokenResponse;
import com.elocampo.authservice.token.TokenValidationResponse;

public interface TokenService {

    TokenResponse generate(TokenInput request);

    TokenValidationResponse validate(String token);
}
