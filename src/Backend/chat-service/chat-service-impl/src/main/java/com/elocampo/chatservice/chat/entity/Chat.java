package com.elocampo.chatservice.chat.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat")
public class Chat {

    @Id
    private String id;

    private String senderAccountId;
    private String receiverAccountId;
    private Set<Message> messages;
    private Boolean removed;
    private Instant createdAt;
    private Instant updatedAt;
}