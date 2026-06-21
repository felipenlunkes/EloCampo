package com.elocampo.chatservice.chat.repository;

import com.elocampo.chatservice.chat.entity.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends MongoRepository<Chat, String> {

    Optional<Chat> findBySenderAccountIdAndReceiverAccountIdAndRemovedFalse(String senderAccountId, String receiverAccountId);

    @Query("{ 'removed': false, '$or': [{ 'senderAccountId': ?0 }, { 'receiverAccountId': ?0 }] }")
    List<Chat> findAllByAccountId(String accountId);

    Optional<Chat> findByIdAndRemovedFalse(String id);
}
