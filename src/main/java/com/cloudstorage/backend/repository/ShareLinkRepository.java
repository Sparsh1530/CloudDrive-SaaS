package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {
    Optional<ShareLink> findByToken(String token);
}