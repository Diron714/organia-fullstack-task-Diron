package com.organia.taskmanager.dto.response;
import java.time.Instant;
public record NotificationResponse(Long id,String title,String message,String type,boolean isRead,Long relatedTaskId,Instant createdAt) {}
