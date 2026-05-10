package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.PagedResponse;
import com.organia.taskmanager.dto.response.TaskActivityResponse;
import com.organia.taskmanager.dto.response.TaskDashboardSummary;
import com.organia.taskmanager.dto.response.TaskResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.TaskService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@SecurityRequirement(name = "BearerAuth")
public class TaskController {
  private final TaskService taskService;
  private final UserRepository userRepository;

  public TaskController(TaskService taskService, UserRepository userRepository) {
    this.taskService = taskService;
    this.userRepository = userRepository;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping("/dashboard")
  public TaskDashboardSummary dashboard(Authentication auth) {
    return taskService.dashboardSummary(current(auth));
  }

  @GetMapping
  public PagedResponse<TaskResponse> list(
      Authentication auth,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) LocalDate startDate,
      @RequestParam(required = false) LocalDate endDate) {
    return taskService.list(current(auth), page, size, sort, direction, status, priority, q, startDate, endDate);
  }

  @PostMapping
  public ResponseEntity<TaskResponse> create(Authentication auth, @Valid @RequestBody CreateTaskRequest req) {
    return ResponseEntity.status(201).body(taskService.create(current(auth), req));
  }

  @GetMapping("/{id}")
  public TaskResponse get(Authentication auth, @PathVariable Long id) {
    return taskService.get(current(auth), id);
  }

  @PutMapping("/{id}")
  public TaskResponse update(Authentication auth, @PathVariable Long id, @Valid @RequestBody UpdateTaskRequest req) {
    return taskService.update(current(auth), id, req);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
    taskService.delete(current(auth), id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/status")
  public TaskResponse status(Authentication auth, @PathVariable Long id, @Valid @RequestBody UpdateStatusRequest req) {
    return taskService.updateStatus(current(auth), id, req);
  }

  @GetMapping("/{id}/activity")
  public java.util.List<TaskActivityResponse> activity(Authentication auth, @PathVariable Long id) {
    return taskService.activity(current(auth), id);
  }
}
