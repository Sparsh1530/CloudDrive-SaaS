package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {

    List<File> findByOwnerIdAndFolderIdIsNullAndIsTrashedFalse(Long ownerId);

    List<File> findByOwnerIdAndFolderIdAndIsTrashedFalse(Long ownerId, Long folderId);

    List<File> findByOwnerIdAndIsTrashedTrue(Long ownerId);
}