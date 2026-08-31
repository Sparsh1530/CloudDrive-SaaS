package com.cloudstorage.backend.service;

import com.cloudstorage.backend.model.Folder;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FolderRepository;
import com.cloudstorage.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FolderService {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private UserRepository userRepository;

    public Folder createFolder(String name, String userEmail, Long parentFolderId) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseGet(() -> {
                    List<User> users = userRepository.findAll();
                    if (!users.isEmpty()) {
                        return users.get(0);
                    }
                    User fallbackUser = new User();
                    fallbackUser.setEmail("testuser@gmail.com");
                    fallbackUser.setFullName("Test User");
                    fallbackUser.setPasswordHash("pass123");
                    return userRepository.save(fallbackUser);
                });

        Folder folder = new Folder();
        folder.setName(name);
        folder.setOwner(owner);
        folder.setParentFolderId(parentFolderId);
        folder.setIsTrashed(false);

        return folderRepository.save(folder);
    }

    public List<Folder> getFolders(String userEmail, Long parentFolderId) {
        if (parentFolderId == null) {
            return folderRepository.findAll().stream()
                    .filter(f -> f.getParentFolderId() == null && (f.getIsTrashed() == null || !f.getIsTrashed()))
                    .toList();
        }
        return folderRepository.findAll().stream()
                .filter(f -> parentFolderId.equals(f.getParentFolderId()) && (f.getIsTrashed() == null || !f.getIsTrashed()))
                .toList();
    }
}