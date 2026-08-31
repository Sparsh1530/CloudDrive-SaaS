package com.cloudstorage.backend.controller;

import com.cloudstorage.backend.model.Folder;
import com.cloudstorage.backend.service.FolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin(origins = "*")
public class FolderController {

    @Autowired
    private FolderService folderService;

    @GetMapping
    public ResponseEntity<List<Folder>> getFolders(@RequestParam(required = false) Long parentFolderId) {
        return ResponseEntity.ok(folderService.getFolders("testuser@gmail.com", parentFolderId));
    }

    @PostMapping
    public ResponseEntity<Folder> createFolder(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        Long parentFolderId = payload.get("parentFolderId") != null ? 
                              Long.valueOf(payload.get("parentFolderId").toString()) : null;
        return ResponseEntity.ok(folderService.createFolder(name, "testuser@gmail.com", parentFolderId));
    }
}