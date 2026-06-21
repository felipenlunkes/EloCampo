package com.elocampo.authservice.token;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenInput {

    @NotBlank(message = "email cannot be blank")
    @Email
    @Size(max = 70, message = "Email cannot be greater than 70 characters")
    private String email;

    @NotBlank(message = "password cannot be null or blank")
    private String password;
}
