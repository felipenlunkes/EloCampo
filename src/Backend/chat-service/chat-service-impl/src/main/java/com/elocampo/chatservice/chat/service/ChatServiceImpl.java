package com.elocampo.chatservice.chat.service;

import com.elocampo.chatservice.chat.ChatInput;
import com.elocampo.chatservice.chat.ChatResponse;
import com.elocampo.chatservice.chat.MessageInput;
import com.elocampo.chatservice.chat.MessageResponse;
import com.elocampo.chatservice.chat.entity.Chat;
import com.elocampo.chatservice.chat.entity.Message;
import com.elocampo.chatservice.chat.mapper.ChatMapper;
import com.elocampo.chatservice.chat.repository.ChatRepository;
import com.elocampo.chatservice.exceptions.NotFoundException;
import com.elocampo.chatservice.exceptions.ValidationErrorException;
import com.elocampo.chatservice.util.UuidV7;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Validated
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;

    @Override
    @Transactional
    public ChatResponse create(ChatInput request) {

        var duplicatedChat = chatRepository.findBySenderAccountIdAndReceiverAccountIdAndRemovedFalse(
                request.getSenderAccountId().toString(),
                request.getReceiverAccountId().toString());

        if (duplicatedChat.isPresent()) {
            throw new ValidationErrorException("duplicated chat for sender and receiver accounts");
        }

        var chat = Chat.builder()
                .id(UuidV7.generate().toString())
                .receiverAccountId(request.getReceiverAccountId().toString())
                .senderAccountId(request.getSenderAccountId().toString())
                .removed(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .messages(new HashSet<>())
                .build();

        chatRepository.save(chat);

        return ChatMapper.toChatResponse(chat);
    }

    @Override
    public List<ChatResponse> getAllByAccountId(UUID accountId) {

        return chatRepository.findAllByAccountId(accountId.toString())
                .stream()
                .map(ChatMapper::toChatResponse)
                .toList();
    }

    @Override
    public Optional<ChatResponse> findById(UUID id) {

        var chat = chatRepository.findByIdAndRemovedFalse(id.toString());

        if (chat.isEmpty()) {
            throw new NotFoundException("chat not found");
        }

        return Optional.of(ChatMapper.toChatResponse(chat.get()));
    }

    @Override
    @Transactional
    public MessageResponse addMessage(UUID id, MessageInput input) {

        var chatFound = chatRepository.findByIdAndRemovedFalse(id.toString());

        if (chatFound.isEmpty()) {
            throw new NotFoundException("chat not found by id");
        }

        var message = Message.builder()
                .id(UuidV7.generate().toString())
                .senderAccountId(input.getAccountId().toString())
                .content(input.getContent())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        var chat = chatFound.get();

        if (chat.getMessages() == null) {
            chat.setMessages(new HashSet<>());
        }

        chat.getMessages().add(message);

        chatRepository.save(chat);

        return ChatMapper.toMessageResponse(message);
    }
}
