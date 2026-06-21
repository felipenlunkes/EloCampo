package com.elocampo.fileservice.file.controller;

import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.FileUploadResponse;
import com.elocampo.fileservice.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") FileEntityType entityType,
            @RequestParam("entityId") String entityId,
            @RequestHeader("X-User-Id") String uploadedBy
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileService.upload(file, entityType, entityId, uploadedBy));
    }

    @GetMapping
    public ResponseEntity<List<FileUploadResponse>> findByEntity(
            @RequestParam FileEntityType entityType,
            @RequestParam String entityId
    ) {
        return ResponseEntity.ok(fileService.findByEntity(entityType, entityId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        fileService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
