package com.organia.taskmanager.mapper;

import com.organia.taskmanager.dto.response.NotificationResponse;
import com.organia.taskmanager.entity.Notification;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
  default NotificationResponse toResponse(Notification n) {
    return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.getType().name(), n.isRead(), n.getRelatedTaskId(), n.getCreatedAt());
  }
}
