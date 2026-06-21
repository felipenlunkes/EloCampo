package com.elocampo.authservice.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    @Field("isAdmin")
    private boolean admin;

    private boolean removed;

    private long createdAt;

    private long updatedAt;
}
