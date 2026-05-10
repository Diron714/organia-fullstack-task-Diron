package com.organia.taskmanager.dto.response;

public record PriorityCompletionDto(
    String priority, long total, long completed, double completionRate) {}
