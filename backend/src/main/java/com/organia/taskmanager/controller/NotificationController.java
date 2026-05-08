package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.response.NotificationResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.repository.NotificationRepository;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.NotificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@SecurityRequirement(name = "BearerAuth")
public class NotificationController {
  private final NotificationService notificationService; private final UserRepository userRepository; private final NotificationRepository notificationRepository;
  public NotificationController(NotificationService notificationService, UserRepository userRepository, NotificationRepository notificationRepository){ this.notificationService=notificationService; this.userRepository=userRepository; this.notificationRepository=notificationRepository; }
  private User current(Authentication auth){ return userRepository.findByEmail(auth.getName()).orElseThrow(); }
  @GetMapping public com.organia.taskmanager.dto.response.PagedResponse<NotificationResponse> list(Authentication auth,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){ var p=notificationService.list(current(auth),page,size); return new com.organia.taskmanager.dto.response.PagedResponse<>(p.getContent(),p.getNumber(),p.getSize(),p.getTotalElements(),p.getTotalPages()); }
  @GetMapping("/unread-count") public Map<String,Long> unread(Authentication auth){ return Map.of("count", notificationService.unread(current(auth))); }
  @PatchMapping("/{id}/read") public void markRead(Authentication auth,@PathVariable Long id){ var n=notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found")); n.setRead(true); notificationRepository.save(n); }
  @PatchMapping("/read-all") public void markAll(Authentication auth){ var user=current(auth); var page=notificationService.list(user,0,1000); page.getContent().forEach(r -> { var n=notificationRepository.findById(r.id()).orElse(null); if(n!=null){ n.setRead(true); notificationRepository.save(n);} }); }
  @DeleteMapping("/{id}") public void delete(@PathVariable Long id){ notificationRepository.deleteById(id); }
}
