package com.cloudstorage.backend.service;

import com.cloudstorage.backend.dto.AuthRequest;
import com.cloudstorage.backend.dto.AuthResponse;
import com.cloudstorage.backend.model.User;
import com.cloudstorage.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public String register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already taken!");
        }

        User user = new User(
            request.getEmail(),
            request.getPassword(),
            request.getFullName(),
            "USER"
        );

        userRepository.save(user);
        return "User registered successfully!";
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password!"));

        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password!");
        }

        return new AuthResponse("mock-jwt-token-xyz", user.getEmail());
    }
}