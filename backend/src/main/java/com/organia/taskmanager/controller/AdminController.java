package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.AdminService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {
  private final AdminService adminService;
  private final UserRepository userRepository;

  public AdminController(AdminService adminService, UserRepository userRepository) {
    this.adminService = adminService;
    this.userRepository = userRepository;
  }

  @GetMapping("/users")
  public PagedResponse<AdminUserRowResponse> users(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String q) {
    return adminService.users(page, size, q);
  }

  @GetMapping("/users/list")
  public java.util.List<UserResponse> usersList() {
    return adminService.usersList();
  }

  @PutMapping("/users/{id}/role")
  public MessageResponse role(@PathVariable Long id, @Valid @RequestBody ChangeUserRoleRequest req) {
    return adminService.changeRole(id, req);
  }

  @DeleteMapping("/users/{id}")
  public MessageResponse deleteUser(@PathVariable Long id) {
    return adminService.deleteUser(id);
  }

  @GetMapping("/tasks")
  public PagedResponse<TaskResponse> tasks(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) Long userId,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction) {
    return adminService.tasks(page, size, q, status, priority, userId, sort, direction);
  }

  @PatchMapping("/tasks/{id}/assign")
  public TaskResponse assign(
      Authentication auth, @PathVariable Long id, @Valid @RequestBody AssignTaskRequest req) {
    User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
    return adminService.assign(admin, id, req);
  }

  @PostMapping("/tasks/bulk-action")
  public MessageResponse bulk(Authentication auth, @Valid @RequestBody BulkTaskActionRequest req) {
    User admin = userRepository.findByEmail(auth.getName()).orElseThrow();
    return adminService.bulk(admin, req);
  }

  @GetMapping("/stats")
  public Map<String, Object> stats() {
    return adminService.stats();
  }
}
