package com.organia.taskmanager.dto.response;

import java.time.Instant;

public record MeProfileResponse(
    Long id,
    String name,
    String email,
    String role,
    String avatarUrl,
    boolean isVerified,
    Instant createdAt,
    TaskStatsDto taskStats) {}
