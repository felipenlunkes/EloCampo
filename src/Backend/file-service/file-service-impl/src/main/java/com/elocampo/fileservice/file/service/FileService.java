package com.elocampo.fileservice.file.service;

import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService {

    FileUploadResponse upload(MultipartFile file, FileEntityType entityType, String entityId, String uploadedBy);

    List<FileUploadResponse> findByEntity(FileEntityType entityType, String entityId);

    void delete(String id);
}
