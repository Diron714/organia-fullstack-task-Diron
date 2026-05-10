package com.organia.taskmanager.dto.response;

import java.time.LocalDate;

public record TaskSearchResult(
    Long id, String title, String status, String priority, LocalDate dueDate, boolean isOverdue) {}
