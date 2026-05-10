package com.organia.taskmanager.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TaskResponse(
    Long id,
    String title,
    String description,
    String status,
    String priority,
    LocalDate dueDate,
    boolean isOverdue,
    String ownerName,
    String ownerAvatar,
    String assignedToName,
    String assignedToAvatar,
    Long assignedToId,
    long activityCount,
    Instant createdAt,
    Instant updatedAt,
    long commentCount,
    List<LabelResponse> labels,
    int totalTrackedSeconds,
    List<TaskDependencyResponse> dependsOn,
    List<TaskDependencyResponse> blocking,
    boolean isBlocked,
    int blockedCount,
    String recurrenceType,
    LocalDate recurrenceEndDate,
    boolean isRecurring,
    String dependencyWarning) {}
