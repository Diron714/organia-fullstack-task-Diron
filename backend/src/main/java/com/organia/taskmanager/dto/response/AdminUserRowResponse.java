package com.organia.taskmanager.dto.response;

import java.time.Instant;

public record AdminUserRowResponse(
    Long id,
    String name,
    String email,
    String role,
    boolean isVerified,
    long taskCount,
    Instant createdAt,
    String avatarUrl) {}
