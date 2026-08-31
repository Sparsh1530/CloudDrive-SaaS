package com.cloudstorage.backend.repository;

import com.cloudstorage.backend.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShareRepository extends JpaRepository<Share, Long> {
    List<Share> findBySharedWithUserEmail(String email);
}