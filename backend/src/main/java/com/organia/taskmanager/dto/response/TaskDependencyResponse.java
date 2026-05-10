package com.organia.taskmanager.dto.response;

public record TaskDependencyResponse(
    Long id, String title, String status, boolean isCompleted, boolean isOverdue) {}
