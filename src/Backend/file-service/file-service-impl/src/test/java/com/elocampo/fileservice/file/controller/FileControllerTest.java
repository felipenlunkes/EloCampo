package com.elocampo.fileservice.file.controller;

import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.FileUploadResponse;
import com.elocampo.fileservice.file.service.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @Mock
    private FileService fileService;

    @InjectMocks
    private FileController fileController;

    private MockMultipartFile file;
    private String entityId;
    private String uploadedBy;
    private FileUploadResponse response;

    @BeforeEach
    void setUp() {
        file = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}
        );
        entityId = UUID.randomUUID().toString();
        uploadedBy = UUID.randomUUID().toString();

        response = FileUploadResponse.builder()
                .id(UUID.randomUUID().toString())
                .publicId("elocampo/products/abc123")
                .url("http://res.cloudinary.com/demo/image/upload/abc123.jpg")
                .secureUrl("https://res.cloudinary.com/demo/image/upload/abc123.jpg")
                .format("jpg")
                .size(12345L)
                .entityType(FileEntityType.PRODUCT)
                .entityId(entityId)
                .uploadedBy(uploadedBy)
                .uploadedAt(System.currentTimeMillis())
                .build();
    }

    @Test
    void uploadShouldReturn201WithBody() {
        when(fileService.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy)).thenReturn(response);

        var result = fileController.upload(file, FileEntityType.PRODUCT, entityId, uploadedBy);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isEqualTo(response);
    }

    @Test
    void findByEntityShouldReturn200WithList() {
        when(fileService.findByEntity(FileEntityType.PRODUCT, entityId)).thenReturn(List.of(response));

        var result = fileController.findByEntity(FileEntityType.PRODUCT, entityId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactly(response);
    }

    @Test
    void findByEntityShouldReturn200WithEmptyList() {
        when(fileService.findByEntity(FileEntityType.PROFILE, entityId)).thenReturn(List.of());

        var result = fileController.findByEntity(FileEntityType.PROFILE, entityId);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isEmpty();
    }

    @Test
    void deleteShouldReturn204() {
        var id = UUID.randomUUID().toString();
        doNothing().when(fileService).delete(id);

        var result = fileController.delete(id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(result.getBody()).isNull();
        verify(fileService).delete(id);
    }
}
