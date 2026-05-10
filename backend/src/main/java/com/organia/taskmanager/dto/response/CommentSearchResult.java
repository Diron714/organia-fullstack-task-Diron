package com.organia.taskmanager.dto.response;

import java.time.Instant;

public record CommentSearchResult(
    Long id, String content, Long taskId, String taskTitle, Instant createdAt) {}
