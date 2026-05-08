package com.organia.taskmanager.dto.request;
import com.organia.taskmanager.enums.*;
import java.time.LocalDate;
public record UpdateTaskRequest(String title,String description,TaskStatus status,TaskPriority priority,LocalDate dueDate) {}
