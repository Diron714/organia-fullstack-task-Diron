package com.organia.taskmanager.dto.response;

import java.time.Instant;

public record CommentResponse(
    Long id,
    Long taskId,
    Long userId,
    String userName,
    String userAvatar,
    String content,
    Instant createdAt,
    boolean isOwner) {}
