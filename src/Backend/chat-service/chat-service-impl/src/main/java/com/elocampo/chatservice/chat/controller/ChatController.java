package com.elocampo.chatservice.chat.controller;

import com.elocampo.chatservice.chat.ChatInput;
import com.elocampo.chatservice.chat.ChatResponse;
import com.elocampo.chatservice.chat.MessageInput;
import com.elocampo.chatservice.chat.MessageResponse;
import com.elocampo.chatservice.chat.service.ChatService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> create(@RequestBody ChatInput request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.create(request));
    }

    @GetMapping("/{accountId}/chats")
    public ResponseEntity<List<ChatResponse>> getAllByAccountId(@PathVariable UUID accountId) {
        return ResponseEntity.ok(chatService.getAllByAccountId(accountId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatResponse> findById(@PathVariable @NotNull UUID id) {
        return chatService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/message")
    public ResponseEntity<MessageResponse> createMessage(@PathVariable @NotNull UUID id, @RequestBody MessageInput request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.addMessage(id, request));
    }
}
