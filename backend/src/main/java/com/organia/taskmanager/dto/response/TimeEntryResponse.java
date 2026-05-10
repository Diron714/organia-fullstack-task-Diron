package com.organia.taskmanager.dto.response;

import java.time.Instant;

public record TimeEntryResponse(
    Long id,
    Long taskId,
    Long userId,
    String userName,
    Instant startedAt,
    Instant stoppedAt,
    Integer durationSeconds,
    String note,
    boolean active) {}
