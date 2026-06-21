package com.elocampo.chatservice.chat.service;

import com.elocampo.chatservice.chat.ChatInput;
import com.elocampo.chatservice.chat.ChatResponse;
import com.elocampo.chatservice.chat.MessageInput;
import com.elocampo.chatservice.chat.MessageResponse;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatService {
    ChatResponse create(@Valid ChatInput request);

    List<ChatResponse> getAllByAccountId(UUID accountId);

    Optional<ChatResponse> findById(UUID id);

    MessageResponse addMessage(UUID id, MessageInput input);
}
