package com.organia.taskmanager.dto.response;

public record TaskDashboardSummary(long total, long todo, long inProgress, long completed, long overdue) {}
