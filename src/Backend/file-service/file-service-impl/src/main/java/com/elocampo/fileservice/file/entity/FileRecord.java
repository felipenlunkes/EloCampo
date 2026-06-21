package com.elocampo.fileservice.file.entity;

import com.elocampo.fileservice.file.FileEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "file_record")
public class FileRecord {

    @Id
    private String id;

    private String publicId;
    private String url;
    private String secureUrl;
    private String format;
    private long size;
    private FileEntityType entityType;
    private String entityId;
    private String uploadedBy;

    @CreatedDate
    private Instant uploadedAt;
}
