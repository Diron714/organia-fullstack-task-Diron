package com.organia.taskmanager.dto.response;
import java.time.*;
public record TaskResponse(Long id,String title,String description,String status,String priority,LocalDate dueDate,boolean isOverdue,String ownerName,String assignedToName,String assignedToAvatar,long activityCount,Instant createdAt,Instant updatedAt) {}
