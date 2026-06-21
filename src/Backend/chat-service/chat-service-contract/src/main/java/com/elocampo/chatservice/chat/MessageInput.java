package com.elocampo.chatservice.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class MessageInput {

    @NotNull(message = "accountId is required")
    private UUID accountId;

    @NotBlank(message = "content is required")
    @Size(max = 280, message = "content cannot be greater than 280 characters")
    private String content;

    private Long createdAt;
    private Long updatedAt;
}
