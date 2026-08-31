package com.cloudstorage.backend.dto;

import java.time.LocalDateTime;

public class FileResponse {
    private Long id;
    private String name;
    private Long sizeBytes;
    private String mimeType;
    private LocalDateTime createdAt;
    private Boolean isStarred;

    public FileResponse(Long id, String name, Long sizeBytes, String mimeType, LocalDateTime createdAt, Boolean isStarred) {
        this.id = id;
        this.name = name;
        this.sizeBytes = sizeBytes;
        this.mimeType = mimeType;
        this.createdAt = createdAt;
        this.isStarred = isStarred;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getSizeBytes() { return sizeBytes; }
    public String getMimeType() { return mimeType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Boolean getIsStarred() { return isStarred; }
}