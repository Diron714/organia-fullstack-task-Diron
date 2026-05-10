package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.response.NotificationResponse;
import com.organia.taskmanager.dto.response.PagedResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.NotificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@SecurityRequirement(name = "BearerAuth")
public class NotificationController {
  private final NotificationService notificationService;
  private final UserRepository userRepository;

  public NotificationController(NotificationService notificationService, UserRepository userRepository) {
    this.notificationService = notificationService;
    this.userRepository = userRepository;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping
  public PagedResponse<NotificationResponse> list(Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
    Page<NotificationResponse> p = notificationService.list(current(auth), page, size);
    return new PagedResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
  }

  @GetMapping("/unread-count")
  public Map<String, Long> unread(Authentication auth) {
    return Map.of("count", notificationService.unread(current(auth)));
  }

  @PatchMapping("/{id}/read")
  public void markRead(Authentication auth, @PathVariable Long id) {
    notificationService.markRead(current(auth), id);
  }

  @PatchMapping("/read-all")
  public void markAll(Authentication auth) {
    notificationService.markAllRead(current(auth));
  }

  @DeleteMapping("/{id}")
  public void delete(Authentication auth, @PathVariable Long id) {
    notificationService.deleteForUser(current(auth), id);
  }
}
