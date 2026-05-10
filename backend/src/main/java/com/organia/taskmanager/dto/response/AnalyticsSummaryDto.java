package com.organia.taskmanager.dto.response;

public record AnalyticsSummaryDto(
    long totalCreated,
    long totalCompleted,
    long totalOverdue,
    double completionRate,
    double avgCompletionDays,
    String mostProductiveDay,
    int bestStreak,
    int currentStreak) {}
