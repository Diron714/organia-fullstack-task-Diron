package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.TaskCommentService;
import com.organia.taskmanager.service.TaskDependencyService;
import com.organia.taskmanager.service.TaskService;
import com.organia.taskmanager.service.TimeTrackingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
@SecurityRequirement(name = "BearerAuth")
public class TaskController {
  private final TaskService taskService;
  private final TaskCommentService taskCommentService;
  private final TimeTrackingService timeTrackingService;
  private final TaskDependencyService taskDependencyService;
  private final UserRepository userRepository;

  public TaskController(
      TaskService taskService,
      TaskCommentService taskCommentService,
      TimeTrackingService timeTrackingService,
      TaskDependencyService taskDependencyService,
      UserRepository userRepository) {
    this.taskService = taskService;
    this.taskCommentService = taskCommentService;
    this.timeTrackingService = timeTrackingService;
    this.taskDependencyService = taskDependencyService;
    this.userRepository = userRepository;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping("/dashboard")
  public TaskDashboardSummary dashboard(Authentication auth) {
    return taskService.dashboardSummary(current(auth));
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportTasks(Authentication auth) {
    byte[] csv = taskService.exportTasksToCsv(current(auth));
    ContentDisposition disposition =
        ContentDisposition.attachment().filename("tasks-export.csv", StandardCharsets.UTF_8).build();
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
        .body(csv);
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
      @RequestParam(required = false) LocalDate endDate,
      @RequestParam(required = false) Long labelId,
      @RequestParam(required = false) Boolean overdueOnly) {
    return taskService.list(
        current(auth),
        page,
        size,
        sort,
        direction,
        status,
        priority,
        q,
        startDate,
        endDate,
        labelId,
        overdueOnly);
  }

  @PostMapping
  public ResponseEntity<TaskResponse> create(Authentication auth, @Valid @RequestBody CreateTaskRequest req) {
    return ResponseEntity.status(201).body(taskService.create(current(auth), req));
  }

  @GetMapping("/{id}/comments")
  public List<CommentResponse> getComments(Authentication auth, @PathVariable Long id) {
    return taskCommentService.getComments(current(auth), id);
  }

  @PostMapping("/{id}/comments")
  public CommentResponse addComment(
      Authentication auth, @PathVariable Long id, @Valid @RequestBody CreateCommentRequest req) {
    return taskCommentService.addComment(current(auth), id, req);
  }

  @DeleteMapping("/{id}/comments/{commentId}")
  public ResponseEntity<Void> deleteComment(
      Authentication auth, @PathVariable Long id, @PathVariable Long commentId) {
    taskCommentService.deleteComment(current(auth), id, commentId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/labels/{labelId}")
  public TaskResponse addLabel(
      Authentication auth, @PathVariable Long id, @PathVariable Long labelId) {
    return taskService.addLabelToTask(current(auth), id, labelId);
  }

  @DeleteMapping("/{id}/labels/{labelId}")
  public TaskResponse removeLabel(
      Authentication auth, @PathVariable Long id, @PathVariable Long labelId) {
    return taskService.removeLabelFromTask(current(auth), id, labelId);
  }

  @GetMapping("/{id}/dependencies")
  public List<TaskDependencyResponse> listDependencies(Authentication auth, @PathVariable Long id) {
    return taskDependencyService.listDependencies(current(auth), id);
  }

  @PostMapping("/{id}/dependencies")
  public List<TaskDependencyResponse> addDependency(
      Authentication auth,
      @PathVariable Long id,
      @Valid @RequestBody AddDependencyRequest req) {
    return taskDependencyService.addDependency(current(auth), id, req.dependsOnTaskId());
  }

  @DeleteMapping("/{id}/dependencies/{dependsOnTaskId}")
  public ResponseEntity<Void> removeDependency(
      Authentication auth, @PathVariable Long id, @PathVariable Long dependsOnTaskId) {
    taskDependencyService.removeDependency(current(auth), id, dependsOnTaskId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/time")
  public TaskTimeSummary getTimeSummary(Authentication auth, @PathVariable Long id) {
    return timeTrackingService.getTimeSummary(current(auth), id);
  }

  @GetMapping("/{id}/time/entries")
  public List<TimeEntryResponse> getTimeEntries(Authentication auth, @PathVariable Long id) {
    return timeTrackingService.getTimeEntries(current(auth), id);
  }

  @PostMapping("/{id}/time/start")
  public TimeEntryResponse startTimer(
      Authentication auth,
      @PathVariable Long id,
      @RequestBody(required = false) StartTimerRequest req) {
    return timeTrackingService.startTimer(current(auth), id, req != null ? req : new StartTimerRequest(null));
  }

  @PostMapping("/{id}/time/stop")
  public TimeEntryResponse stopTimer(
      Authentication auth,
      @PathVariable Long id,
      @RequestBody(required = false) StopTimerRequest req) {
    return timeTrackingService.stopTimer(current(auth), id, req != null ? req : new StopTimerRequest(null));
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
