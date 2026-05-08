package com.organia.taskmanager.dto.request;
import com.organia.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
public record UpdateStatusRequest(@NotNull TaskStatus status) {}
