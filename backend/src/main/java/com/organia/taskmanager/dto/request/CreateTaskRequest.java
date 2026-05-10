package com.organia.taskmanager.dto.request;

import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record CreateTaskRequest(
    @NotBlank String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    Long assignedToId,
    RecurrenceType recurrenceType,
    LocalDate recurrenceEndDate) {}
