package com.elocampo.fileservice.file.validator;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Component
public class FileValidator {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png");

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio ou ausente");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Tipo de arquivo não suportado: " + contentType);
        }
    }
}
