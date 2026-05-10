package com.organia.taskmanager.dto.response;

import java.time.LocalDate;

public record StreakResponse(
    int currentStreak,
    int longestStreak,
    LocalDate lastCompletionDate,
    String streakMessage) {}
