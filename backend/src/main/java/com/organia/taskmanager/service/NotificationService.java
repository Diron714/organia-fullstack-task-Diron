package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.NotificationResponse;
import com.organia.taskmanager.entity.Notification;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.NotificationType;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.mapper.NotificationMapper;
import com.organia.taskmanager.repository.NotificationRepository;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
  private final NotificationRepository repository;
  private final NotificationMapper mapper;

  public NotificationService(NotificationRepository repository, NotificationMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  public void create(User user, String title, String message, NotificationType type, Long relatedTaskId) {
    repository.save(
        Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .relatedTaskId(relatedTaskId)
            .isRead(false)
            .createdAt(Instant.now())
            .build());
  }

  public Page<NotificationResponse> list(User user, int page, int size) {
    return repository.findByUserOrderByIsReadAscCreatedAtDesc(user, PageRequest.of(page, size)).map(mapper::toResponse);
  }

  public long unread(User user) {
    return repository.countByUserAndIsReadFalse(user);
  }

  @Transactional
  public void markRead(User user, Long id) {
    Notification n = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    assertOwner(user, n);
    n.setRead(true);
    repository.save(n);
  }

  @Transactional
  public void markAllRead(User user) {
    repository.markAllReadForUser(user.getId());
  }

  @Transactional
  public void deleteForUser(User user, Long id) {
    Notification n = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    assertOwner(user, n);
    repository.delete(n);
  }

  private static void assertOwner(User user, Notification n) {
    if (!n.getUser().getId().equals(user.getId())) {
      throw new ForbiddenException("Not your notification");
    }
  }
}
