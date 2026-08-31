package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByOwnerEmailAndParentFolderIdIsNullAndIsTrashedFalse(String email);
    List<Folder> findByOwnerEmailAndParentFolderIdAndIsTrashedFalse(String email, Long parentFolderId);
}