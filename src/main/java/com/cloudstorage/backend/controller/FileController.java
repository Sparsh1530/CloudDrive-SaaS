package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.dto.FileResponse;
import com.cloudstorage.backend.model.File;
import com.cloudstorage.backend.model.Share;
import com.cloudstorage.backend.model.ShareLink;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.FileRepository;
import com.cloudstorage.backend.repository.ShareLinkRepository;
import com.cloudstorage.backend.repository.ShareRepository;
import com.cloudstorage.backend.repository.UserRepository;
import com.cloudstorage.backend.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShareRepository shareRepository;

    @Autowired
    private ShareLinkRepository shareLinkRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String resolveEmail(String principal) {
        return (principal != null) ? principal : "testuser@gmail.com";
    }

    @GetMapping
    public ResponseEntity<List<FileResponse>> getFiles(
            @RequestParam(required = false) Long folderId,
            @AuthenticationPrincipal String userEmail) {
        return ResponseEntity.ok(fileService.getFiles(resolveEmail(userEmail), folderId));
    }

    @GetMapping("/trash")
    public ResponseEntity<List<FileResponse>> getTrashFiles(@AuthenticationPrincipal String userEmail) {
        return ResponseEntity.ok(fileService.getTrashFiles(resolveEmail(userEmail)));
    }

    @GetMapping("/starred")
    public ResponseEntity<List<FileResponse>> getStarredFiles(@AuthenticationPrincipal String userEmail) {
        return ResponseEntity.ok(fileService.getStarredFiles(resolveEmail(userEmail)));
    }

    @GetMapping("/storage-usage")
    public ResponseEntity<Map<String, Object>> getStorageUsage(@AuthenticationPrincipal String userEmail) {
        List<FileResponse> userFiles = fileService.getFiles(resolveEmail(userEmail), null);
        long totalSizeBytes = userFiles.stream()
                .mapToLong(f -> f.getSizeBytes() != null ? f.getSizeBytes() : 0L)
                .sum();
        long maxStorageBytes = 524288000L; // 500 MB Limit

        return ResponseEntity.ok(Map.of(
            "usedBytes", totalSizeBytes,
            "maxBytes", maxStorageBytes
        ));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            @AuthenticationPrincipal String userEmail) {
        Resource resource = fileService.loadFileAsResource(id, resolveEmail(userEmail));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewFile(
            @PathVariable Long id, 
            @AuthenticationPrincipal String userEmail) {
        File fileMetadata = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
        Resource resource = fileService.loadFileAsResource(id, resolveEmail(userEmail));
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileMetadata.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileMetadata.getName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/download-url")
    public ResponseEntity<Map<String, String>> getPresignedDownloadUrl(@PathVariable Long id) {
        String url = fileService.generatePresignedDownloadUrl(id);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PutMapping("/{id}/star")
    public ResponseEntity<Void> toggleStar(@PathVariable Long id) {
        fileService.toggleStar(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> trashFile(
            @PathVariable Long id,
            @AuthenticationPrincipal String userEmail) {
        fileService.moveToTrash(id, resolveEmail(userEmail));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreFile(
            @PathVariable Long id,
            @AuthenticationPrincipal String userEmail) {
        fileService.restoreFromTrash(id, resolveEmail(userEmail));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> hardDeleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal String userEmail) {
        fileService.permanentlyDelete(id, resolveEmail(userEmail));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @AuthenticationPrincipal String userEmail) {
        return ResponseEntity.ok(fileService.storeFile(file, resolveEmail(userEmail), folderId));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Map<String, String>> createShareLink(
            @PathVariable Long id,
            @RequestParam(required = false) Integer expirationDays,
            @RequestParam(required = false) String password) {
        
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        String token = UUID.randomUUID().toString();
        ShareLink shareLink = new ShareLink();
        shareLink.setToken(token);
        shareLink.setFile(file);

        if (expirationDays != null && expirationDays > 0) {
            shareLink.setExpiresAt(LocalDateTime.now().plusDays(expirationDays));
        }
        if (password != null && !password.trim().isEmpty()) {
            shareLink.setPasswordHash(passwordEncoder.encode(password));
        }

        shareLinkRepository.save(shareLink);
        return ResponseEntity.ok(Map.of("shareUrl", "http://localhost:8080/api/files/public/" + token));
    }

    @PostMapping("/public/{token}")
    public ResponseEntity<Resource> accessPublicFile(
            @PathVariable String token,
            @RequestParam(required = false) String password) {

        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired share link"));

        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Share link has expired");
        }

        if (shareLink.getPasswordHash() != null && !shareLink.getPasswordHash().isEmpty()) {
            if (password == null || !passwordEncoder.matches(password, shareLink.getPasswordHash())) {
                throw new RuntimeException("Invalid password for shared file");
            }
        }

        File file = shareLink.getFile();
        Resource resource = fileService.loadFileAsResource(file.getId(), file.getOwner().getEmail());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .body(resource);
    }

    @PostMapping("/{id}/share-user")
    public ResponseEntity<?> shareWithUser(
            @PathVariable Long id,
            @RequestParam String targetEmail,
            @RequestParam(defaultValue = "VIEWER") String role) {

        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));

        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Share share = new Share();
        share.setFile(file);
        share.setSharedWithUser(targetUser);
        share.setRole(role.toUpperCase());

        shareRepository.save(share);
        return ResponseEntity.ok(Map.of("message", "File shared successfully with " + targetEmail));
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<FileResponse>> getSharedWithMeFiles(@AuthenticationPrincipal String userEmail) {
        String email = resolveEmail(userEmail);
        List<Share> shares = shareRepository.findBySharedWithUserEmail(email);

        List<FileResponse> responses = shares.stream().map(share -> {
            File f = share.getFile();
            return new FileResponse(f.getId(), f.getName(), f.getSizeBytes(), f.getMimeType(), f.getCreatedAt(), f.getIsStarred());
        }).toList();

        return ResponseEntity.ok(responses);
    }
}