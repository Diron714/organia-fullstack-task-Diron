package com.organia.taskmanager.dto.response;

public record TaskTimeSummary(
    Long taskId,
    int totalSeconds,
    int entryCount,
    boolean hasActiveTimer,
    TimeEntryResponse activeEntry) {}
