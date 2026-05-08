package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.NotificationResponse;
import com.organia.taskmanager.entity.Notification;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.NotificationType;
import com.organia.taskmanager.mapper.NotificationMapper;
import com.organia.taskmanager.repository.NotificationRepository;
import java.time.Instant;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
  private final NotificationRepository repository; private final NotificationMapper mapper;
  public NotificationService(NotificationRepository repository, NotificationMapper mapper){ this.repository=repository; this.mapper=mapper; }
  public void create(User user,String title,String message,NotificationType type,Long relatedTaskId){ repository.save(Notification.builder().user(user).title(title).message(message).type(type).relatedTaskId(relatedTaskId).isRead(false).createdAt(Instant.now()).build()); }
  public Page<NotificationResponse> list(User user,int page,int size){ return repository.findByUserOrderByIsReadAscCreatedAtDesc(user, PageRequest.of(page,size)).map(mapper::toResponse); }
  public long unread(User user){ return repository.countByUserAndIsReadFalse(user); }
}
