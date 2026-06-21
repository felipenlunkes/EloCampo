package com.elocampo.chatservice.chat.mapper;

import com.elocampo.chatservice.chat.ChatResponse;
import com.elocampo.chatservice.chat.MessageResponse;
import com.elocampo.chatservice.chat.entity.Chat;
import com.elocampo.chatservice.chat.entity.Message;
import org.springframework.util.CollectionUtils;

import java.util.UUID;
import java.util.stream.Collectors;

import static org.apache.commons.lang3.StringUtils.isBlank;

public class ChatMapper {

    public static ChatResponse toChatResponse(Chat input) {

        var chatResponse = new ChatResponse();

        chatResponse.setId(UUID.fromString(input.getId()));
        chatResponse.setSenderAccountId(UUID.fromString(input.getSenderAccountId()));
        chatResponse.setReceiverAccountId(UUID.fromString(input.getReceiverAccountId()));

        if (!CollectionUtils.isEmpty(input.getMessages())) {
            chatResponse.setMessages(input.getMessages().stream().map(ChatMapper::toMessageResponse).collect(Collectors.toSet()));
        }

        chatResponse.setCreatedAt(input.getCreatedAt().toEpochMilli());
        chatResponse.setUpdatedAt(input.getUpdatedAt().toEpochMilli());

        return chatResponse;
    }

    public static MessageResponse toMessageResponse(Message input) {

        var messageResponse = new MessageResponse();

        messageResponse.setId(UUID.fromString(input.getId()));

        if (!isBlank(input.getSenderAccountId())) {
            messageResponse.setSenderAccountId(UUID.fromString(input.getSenderAccountId()));
        }

        messageResponse.setContent(input.getContent());
        messageResponse.setCreatedAt(input.getCreatedAt().toEpochMilli());
        messageResponse.setUpdatedAt(input.getUpdatedAt().toEpochMilli());

        return messageResponse;
    }
}
