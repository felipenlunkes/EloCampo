package com.elocampo.chatservice.chat;

import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class ChatResponse {

    private UUID id;
    private UUID senderAccountId;
    private UUID receiverAccountId;
    private Set<MessageResponse> messages;
    private Long createdAt;
    private Long updatedAt;
}
