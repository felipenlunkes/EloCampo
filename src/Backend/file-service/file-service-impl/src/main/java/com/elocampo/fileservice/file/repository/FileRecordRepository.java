package com.elocampo.fileservice.file.repository;

import com.elocampo.fileservice.file.FileEntityType;
import com.elocampo.fileservice.file.entity.FileRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FileRecordRepository extends MongoRepository<FileRecord, String> {

    List<FileRecord> findByEntityTypeAndEntityId(FileEntityType entityType, String entityId);

    List<FileRecord> findByEntityType(FileEntityType entityType);
}
