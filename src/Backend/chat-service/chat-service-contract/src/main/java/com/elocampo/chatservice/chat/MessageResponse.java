package com.elocampo.chatservice.chat;

import lombok.Data;

import java.util.UUID;

@Data
public class MessageResponse {

    private UUID id;
    private UUID senderAccountId;
    private String content;
    private Long createdAt;
    private Long updatedAt;
}
