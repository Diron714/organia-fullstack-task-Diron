package com.organia.taskmanager.dto.request;

import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import java.time.LocalDate;

public record UpdateTaskRequest(
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    RecurrenceType recurrenceType,
    LocalDate recurrenceEndDate) {}
