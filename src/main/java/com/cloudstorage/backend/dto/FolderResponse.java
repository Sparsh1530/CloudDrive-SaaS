package com.cloudstorage.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FolderResponse {
    private Long id;
    private String name;
    private Long parentFolderId;
    private boolean isTrashed;
    private LocalDateTime createdAt;
}