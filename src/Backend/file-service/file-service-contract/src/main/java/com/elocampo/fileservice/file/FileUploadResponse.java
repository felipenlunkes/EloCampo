package com.elocampo.fileservice.file;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    private String id;
    private String publicId;
    private String url;
    private String secureUrl;
    private String format;
    private long size;
    private FileEntityType entityType;
    private String entityId;
    private String uploadedBy;
    private Long uploadedAt;
}
