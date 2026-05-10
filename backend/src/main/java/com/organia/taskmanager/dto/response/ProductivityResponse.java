package com.organia.taskmanager.dto.response;

public record ProductivityResponse(
    int weeklyScore,
    int tasksCompletedThisWeek,
    int tasksDueThisWeek,
    int tasksOverdue,
    String trend,
    int lastWeekScore,
    String message) {}
