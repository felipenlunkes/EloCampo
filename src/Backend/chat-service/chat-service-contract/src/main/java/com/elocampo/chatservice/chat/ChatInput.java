package com.elocampo.chatservice.chat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatInput {

    @NotNull(message = "senderAccountId is required")
    private UUID senderAccountId;

    @NotNull(message = "receiverAccountId is required")
    private UUID receiverAccountId;
}
