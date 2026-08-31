package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.FileResponse;
import com.cloudstorage.backend.model.File;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FileRepository;
import com.cloudstorage.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class FileService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    public FileResponse storeFile(MultipartFile file, String userEmail, Long folderId) {
        try {
            User owner = userRepository.findByEmail(userEmail)
                    .orElseGet(() -> {
                        List<User> users = userRepository.findAll();
                        if (!users.isEmpty()) return users.get(0);
                        User fallbackUser = new User();
                        fallbackUser.setEmail("testuser@gmail.com");
                        fallbackUser.setFullName("Test User");
                        fallbackUser.setPasswordHash("pass123");
                        return userRepository.save(fallbackUser);
                    });

            Path copyLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(copyLocation)) {
                Files.createDirectories(copyLocation);
            }

            String originalName = (file.getOriginalFilename() != null) ? file.getOriginalFilename() : "file";
            String fileName = UUID.randomUUID().toString() + "_" + originalName;
            Path targetLocation = copyLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            File newFile = new File();
            newFile.setName(originalName);
            newFile.setS3Key(targetLocation.toString());
            newFile.setSizeBytes(file.getSize());
            newFile.setMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            newFile.setFolderId(folderId);
            newFile.setIsTrashed(false);
            newFile.setIsStarred(false);
            newFile.setOwner(owner);

            File saved = fileRepository.save(newFile);

            return new FileResponse(
                saved.getId(), saved.getName(), saved.getSizeBytes(), saved.getMimeType(), saved.getCreatedAt(), saved.getIsStarred()
            );
        } catch (Exception ex) {
            throw new RuntimeException("Upload failed: " + ex.getMessage(), ex);
        }
    }

    public List<FileResponse> getFiles(String userEmail, Long folderId) {
        return fileRepository.findAll().stream()
                .filter(f -> (f.getIsTrashed() == null || !f.getIsTrashed()))
                .filter(f -> (folderId == null ? f.getFolderId() == null : folderId.equals(f.getFolderId())))
                .map(f -> new FileResponse(f.getId(), f.getName(), f.getSizeBytes(), f.getMimeType(), f.getCreatedAt(), Boolean.TRUE.equals(f.getIsStarred())))
                .collect(Collectors.toList());
    }

    public List<FileResponse> getTrashFiles(String userEmail) {
        return fileRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsTrashed()))
                .map(f -> new FileResponse(f.getId(), f.getName(), f.getSizeBytes(), f.getMimeType(), f.getCreatedAt(), Boolean.TRUE.equals(f.getIsStarred())))
                .collect(Collectors.toList());
    }

    public List<FileResponse> getStarredFiles(String userEmail) {
        return fileRepository.findAll().stream()
                .filter(f -> (f.getIsTrashed() == null || !f.getIsTrashed()))
                .filter(f -> Boolean.TRUE.equals(f.getIsStarred()))
                .map(f -> new FileResponse(f.getId(), f.getName(), f.getSizeBytes(), f.getMimeType(), f.getCreatedAt(), true))
                .collect(Collectors.toList());
    }

    public void toggleStar(Long id) {
        File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
        file.setIsStarred(!Boolean.TRUE.equals(file.getIsStarred()));
        fileRepository.save(file);
    }

    public Resource loadFileAsResource(Long id, String userEmail) {
        try {
            File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
            Path filePath = Paths.get(file.getS3Key()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) return resource;
            else throw new RuntimeException("File not found on disk");
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File error", ex);
        }
    }

    public void moveToTrash(Long id, String userEmail) {
        File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
        file.setIsTrashed(true);
        fileRepository.save(file);
    }

    public void restoreFromTrash(Long id, String userEmail) {
        File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
        file.setIsTrashed(false);
        fileRepository.save(file);
    }

    public void permanentlyDelete(Long id, String userEmail) {
        File file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));
        try {
            Files.deleteIfExists(Paths.get(file.getS3Key()));
        } catch (Exception ignored) {}
        fileRepository.delete(file);
    }

    public String generatePresignedDownloadUrl(Long fileId) {
        return "http://localhost:8080/api/files/download/" + fileId;
    }
}