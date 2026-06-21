package com.elocampo.fileservice.file.validator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidatorTest {

    private FileValidator validator;

    @BeforeEach
    void setUp() {
        validator = new FileValidator();
    }

    @Test
    void validateAcceptsJpeg() {
        var file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", "content".getBytes());

        assertThatNoException().isThrownBy(() -> validator.validate(file));
    }

    @Test
    void validateAcceptsPng() {
        var file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        assertThatNoException().isThrownBy(() -> validator.validate(file));
    }

    @Test
    void validateThrowsWhenContentTypeIsNull() {
        var file = new MockMultipartFile("file", "photo.jpg", null, "content".getBytes());

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de arquivo não suportado");
    }

    @Test
    void validateThrowsWhenContentTypeIsUnsupported() {
        var file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "content".getBytes());

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tipo de arquivo não suportado");
    }

    @Test
    void validateThrowsWhenFileIsEmpty() {
        var file = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> validator.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Arquivo vazio ou ausente");
    }
}
