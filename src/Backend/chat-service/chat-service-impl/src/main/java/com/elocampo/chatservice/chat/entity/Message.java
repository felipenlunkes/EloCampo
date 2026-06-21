package com.elocampo.chatservice.chat.entity;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class Message {

    private String id;
    private String senderAccountId;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
}
