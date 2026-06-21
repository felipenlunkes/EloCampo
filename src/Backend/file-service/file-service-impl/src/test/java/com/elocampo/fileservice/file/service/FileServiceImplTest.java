package com.elocampo.fileservice.file.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.elocampo.fileservice.config.client.AccountServiceClient;
import com.elocampo.fileservice.config.client.ProductServiceClient;
import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.entity.FileRecord;
import com.elocampo.fileservice.file.repository.FileRecordRepository;
import com.elocampo.fileservice.file.validator.FileValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @Mock
    private FileValidator fileValidator;

    @Mock
    private FileRecordRepository fileRecordRepository;

    @Mock
    private ProductServiceClient productServiceClient;

    @Mock
    private AccountServiceClient accountServiceClient;

    @InjectMocks
    private FileServiceImpl fileService;

    private MockMultipartFile file;
    private UUID entityUuid;
    private String entityId;
    private String uploadedBy;
    private FileRecord savedRecord;
    private Map<String, Object> cloudinaryResult;

    @BeforeEach
    void setUp() {
        file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46}
        );

        entityUuid = UUID.randomUUID();
        entityId = entityUuid.toString();
        uploadedBy = UUID.randomUUID().toString();

        savedRecord = FileRecord.builder()
                .id(UUID.randomUUID().toString())
                .publicId("elocampo/products/abc123")
                .url("http://res.cloudinary.com/demo/image/upload/abc123.jpg")
                .secureUrl("https://res.cloudinary.com/demo/image/upload/abc123.jpg")
                .format("jpg")
                .size(12345L)
                .entityType(FileEntityType.PRODUCT)
                .entityId(entityId)
                .uploadedBy(uploadedBy)
                .uploadedAt(Instant.now())
                .build();

        cloudinaryResult = new HashMap<>();
        cloudinaryResult.put("public_id", "elocampo/products/abc123");
        cloudinaryResult.put("url", "http://res.cloudinary.com/demo/image/upload/abc123.jpg");
        cloudinaryResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/abc123.jpg");
        cloudinaryResult.put("format", "jpg");
        cloudinaryResult.put("bytes", 12345L);
    }

    @Test
    void uploadWithProductEntitySavesAndReturnsResponse() throws IOException {
        doNothing().when(fileValidator).validate(any());
        when(productServiceClient.findById(entityUuid)).thenReturn(Map.of("id", entityId));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(cloudinaryResult);
        when(fileRecordRepository.save(any(FileRecord.class))).thenReturn(savedRecord);

        var result = fileService.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(savedRecord.getId());
        assertThat(result.getPublicId()).isEqualTo("elocampo/products/abc123");
        assertThat(result.getSecureUrl()).isEqualTo("https://res.cloudinary.com/demo/image/upload/abc123.jpg");
        assertThat(result.getFormat()).isEqualTo("jpg");
        assertThat(result.getSize()).isEqualTo(12345L);
        assertThat(result.getEntityType()).isEqualTo(FileEntityType.PRODUCT);
        assertThat(result.getEntityId()).isEqualTo(entityId);
        assertThat(result.getUploadedBy()).isEqualTo(uploadedBy);

        verify(productServiceClient).findById(entityUuid);
        verify(accountServiceClient, never()).findById(any(UUID.class));
        verify(fileRecordRepository).save(any(FileRecord.class));
    }

    @Test
    void uploadWithProfileEntitySavesAndReturnsResponse() throws IOException {
        savedRecord.setEntityType(FileEntityType.PROFILE);
        savedRecord.setPublicId("elocampo/profiles/abc123");

        doNothing().when(fileValidator).validate(any());
        when(accountServiceClient.findById(entityUuid)).thenReturn(Map.of("id", entityId));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(cloudinaryResult);
        when(fileRecordRepository.save(any(FileRecord.class))).thenReturn(savedRecord);

        var result = fileService.upload(file, FileEntityType.PROFILE, entityId, uploadedBy);

        assertThat(result).isNotNull();
        assertThat(result.getEntityType()).isEqualTo(FileEntityType.PROFILE);

        verify(accountServiceClient).findById(entityUuid);
        verify(productServiceClient, never()).findById(any(UUID.class));
        verify(fileRecordRepository).save(any(FileRecord.class));
    }

    @Test
    void uploadWhenFileInvalidThrowsAndDoesNotPersist() throws IOException {
        doThrow(new IllegalArgumentException("Tipo de arquivo não suportado: application/pdf"))
                .when(fileValidator).validate(any());

        assertThatThrownBy(() -> fileService.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de arquivo não suportado");

        verify(productServiceClient, never()).findById(any(UUID.class));
        verify(cloudinary, never()).uploader();
        verify(fileRecordRepository, never()).save(any(FileRecord.class));
    }

    @Test
    void uploadWhenProductEntityNotFoundThrowsIllegalArgumentException() throws IOException {
        doNothing().when(fileValidator).validate(any());
        when(productServiceClient.findById(entityUuid))
                .thenThrow(new NoSuchElementException("product not found"));

        assertThatThrownBy(() -> fileService.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("entityId não corresponde a uma entidade existente");

        verify(cloudinary, never()).uploader();
        verify(fileRecordRepository, never()).save(any(FileRecord.class));
    }

    @Test
    void uploadWhenEntityIdIsNotValidUuidThrowsIllegalArgumentException() throws IOException {
        doNothing().when(fileValidator).validate(any());

        assertThatThrownBy(() -> fileService.upload(file, FileEntityType.PRODUCT, "not-a-uuid", uploadedBy))
                .isInstanceOf(IllegalArgumentException.class);

        verify(productServiceClient, never()).findById(any(UUID.class));
        verify(cloudinary, never()).uploader();
        verify(fileRecordRepository, never()).save(any(FileRecord.class));
    }

    @Test
    void uploadWhenCloudinaryThrowsIOExceptionWrapsInRuntimeException() throws IOException {
        doNothing().when(fileValidator).validate(any());
        when(productServiceClient.findById(entityUuid)).thenReturn(Map.of("id", entityId));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenThrow(new IOException("cloudinary down"));

        assertThatThrownBy(() -> fileService.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Erro ao fazer upload do arquivo");

        verify(fileRecordRepository, never()).save(any(FileRecord.class));
    }

    @Test
    void findByEntityReturnsMappedResponses() {
        when(fileRecordRepository.findByEntityTypeAndEntityId(FileEntityType.PRODUCT, entityId))
                .thenReturn(List.of(savedRecord));

        var result = fileService.findByEntity(FileEntityType.PRODUCT, entityId);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getId()).isEqualTo(savedRecord.getId());
        assertThat(result.getFirst().getPublicId()).isEqualTo(savedRecord.getPublicId());
        assertThat(result.getFirst().getEntityId()).isEqualTo(entityId);
        assertThat(result.getFirst().getEntityType()).isEqualTo(FileEntityType.PRODUCT);
    }

    @Test
    void findByEntityReturnsEmptyListWhenNoneFound() {
        when(fileRecordRepository.findByEntityTypeAndEntityId(FileEntityType.PRODUCT, entityId))
                .thenReturn(List.of());

        var result = fileService.findByEntity(FileEntityType.PRODUCT, entityId);

        assertThat(result).isEmpty();
    }

    @Test
    void deleteRemovesFromCloudinaryAndRepository() throws IOException {
        when(fileRecordRepository.findById(savedRecord.getId())).thenReturn(Optional.of(savedRecord));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq(savedRecord.getPublicId()), anyMap())).thenReturn(Map.of("result", "ok"));

        fileService.delete(savedRecord.getId());

        verify(uploader).destroy(eq(savedRecord.getPublicId()), anyMap());
        verify(fileRecordRepository).delete(savedRecord);
    }

    @Test
    void deleteWhenRecordNotFoundThrowsNoSuchElementException() {
        when(fileRecordRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fileService.delete("missing-id"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("Arquivo não encontrado");

        verify(cloudinary, never()).uploader();
        verify(fileRecordRepository, never()).delete(any(FileRecord.class));
    }

    @Test
    void deleteWhenCloudinaryThrowsIOExceptionWrapsInRuntimeException() throws IOException {
        when(fileRecordRepository.findById(savedRecord.getId())).thenReturn(Optional.of(savedRecord));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.destroy(eq(savedRecord.getPublicId()), anyMap()))
                .thenThrow(new IOException("cloudinary down"));

        assertThatThrownBy(() -> fileService.delete(savedRecord.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Erro ao deletar o arquivo");

        verify(fileRecordRepository, never()).delete(any(FileRecord.class));
    }
}
