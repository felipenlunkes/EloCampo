package com.elocampo.fileservice.file.service;

import com.cloudinary.Cloudinary;
import com.elocampo.fileservice.config.client.AccountServiceClient;
import com.elocampo.fileservice.config.client.ProductServiceClient;
import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.FileUploadResponse;
import com.elocampo.fileservice.file.entity.FileRecord;
import com.elocampo.fileservice.file.repository.FileRecordRepository;
import com.elocampo.fileservice.file.validator.FileValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final Cloudinary cloudinary;
    private final FileValidator fileValidator;
    private final FileRecordRepository fileRecordRepository;
    private final ProductServiceClient productServiceClient;
    private final AccountServiceClient accountServiceClient;

    @Override
    public FileUploadResponse upload(MultipartFile file, FileEntityType entityType, String entityId, String uploadedBy) {
        try {
            fileValidator.validate(file);
            validateEntityExists(entityType, entityId);

            String folder = switch (entityType) {
                case PRODUCT -> "elocampo/products";
                case PROFILE -> "elocampo/profiles";
            };

            var result = cloudinary.uploader().upload(file.getBytes(), Map.of("folder", folder));

            var record = FileRecord.builder()
                    .publicId((String) result.get("public_id"))
                    .url((String) result.get("url"))
                    .secureUrl((String) result.get("secure_url"))
                    .format((String) result.get("format"))
                    .size(((Number) result.get("bytes")).longValue())
                    .entityType(entityType)
                    .entityId(entityId)
                    .uploadedBy(uploadedBy)
                    .build();

            var saved = fileRecordRepository.save(record);

            log.info("File uploaded: {}", saved);

            return toResponse(saved);

        } catch (IOException e) {
            throw new RuntimeException("Erro ao fazer upload do arquivo", e);
        }
    }

    @Override
    public List<FileUploadResponse> findByEntity(FileEntityType entityType, String entityId) {
        return fileRecordRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(String id) {
        var record = fileRecordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Arquivo não encontrado: " + id));

        try {
            cloudinary.uploader().destroy(record.getPublicId(), Map.of());
            fileRecordRepository.delete(record);
            log.info("File deleted: {}", record.getPublicId());
        } catch (IOException e) {
            throw new RuntimeException("Erro ao deletar o arquivo", e);
        }
    }

    private void validateEntityExists(FileEntityType entityType, String entityId) {
        try {
            switch (entityType) {
                case PRODUCT -> productServiceClient.findById(UUID.fromString(entityId));
                case PROFILE -> accountServiceClient.findById(UUID.fromString(entityId));
            }
        } catch (NoSuchElementException e) {
            throw new IllegalArgumentException("entityId não corresponde a uma entidade existente: " + entityId);
        }
    }

    private FileUploadResponse toResponse(FileRecord r) {
        return FileUploadResponse.builder()
                .id(r.getId())
                .publicId(r.getPublicId())
                .url(r.getUrl())
                .secureUrl(r.getSecureUrl())
                .format(r.getFormat())
                .size(r.getSize())
                .entityType(r.getEntityType())
                .entityId(r.getEntityId())
                .uploadedBy(r.getUploadedBy())
                .uploadedAt(r.getUploadedAt() != null ? r.getUploadedAt().toEpochMilli() : null)
                .build();
    }
}
