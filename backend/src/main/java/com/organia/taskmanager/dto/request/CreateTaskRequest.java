package com.organia.taskmanager.dto.request;
import com.organia.taskmanager.enums.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
public record CreateTaskRequest(@NotBlank String title,String description,TaskStatus status,TaskPriority priority,LocalDate dueDate,Long assignedToId) {}
