package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TaskActivity;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.NotificationType;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.TaskActivityRepository;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
  private final UserRepository userRepository;
  private final TaskRepository taskRepository;
  private final UserMapper userMapper;
  private final TaskMapper taskMapper;
  private final NotificationService notificationService;
  private final TaskActivityService taskActivityService;
  private final TaskActivityRepository taskActivityRepository;

  public AdminService(
      UserRepository userRepository,
      TaskRepository taskRepository,
      UserMapper userMapper,
      TaskMapper taskMapper,
      NotificationService notificationService,
      TaskActivityService taskActivityService,
      TaskActivityRepository taskActivityRepository) {
    this.userRepository = userRepository;
    this.taskRepository = taskRepository;
    this.userMapper = userMapper;
    this.taskMapper = taskMapper;
    this.notificationService = notificationService;
    this.taskActivityService = taskActivityService;
    this.taskActivityRepository = taskActivityRepository;
  }

  public PagedResponse<AdminUserRowResponse> users(int page, int size, String q) {
    Specification<User> spec = (root, query, cb) -> cb.conjunction();
    if (q != null && !q.isBlank()) {
      String term = "%" + q.trim().toLowerCase() + "%";
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.or(
                      cb.like(cb.lower(root.get("name")), term),
                      cb.like(cb.lower(root.get("email")), term)));
    }
    var p =
        userRepository.findAll(
            spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    List<AdminUserRowResponse> rows =
        p.getContent().stream()
            .map(
                u -> {
                  long taskCount =
                      taskRepository.count(
                          (root, query, cb) ->
                              cb.or(
                                  cb.equal(root.get("owner").get("id"), u.getId()),
                                  cb.equal(root.get("assignedTo").get("id"), u.getId())));
                  return new AdminUserRowResponse(
                      u.getId(),
                      u.getName(),
                      u.getEmail(),
                      u.getRole().name(),
                      u.isVerified(),
                      taskCount,
                      u.getCreatedAt(),
                      u.getAvatarUrl());
                })
            .toList();
    return new PagedResponse<>(rows, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
  }

  public List<UserResponse> usersList() {
    return userRepository.findAll().stream().map(userMapper::toResponse).toList();
  }

  public MessageResponse changeRole(Long id, ChangeUserRoleRequest req, User actor) {
    User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    if (user.getRole() == Role.ADMIN && req.role() == Role.USER) {
      long admins = userRepository.countByRole(Role.ADMIN);
      if (admins <= 1) {
        throw new BadRequestException("Cannot demote the only admin");
      }
    }
    user.setRole(req.role());
    userRepository.save(user);
    return new MessageResponse("Role updated");
  }

  public MessageResponse deleteUser(Long id, User actor) {
    if (id.equals(actor.getId())) {
      throw new ForbiddenException("You cannot delete your own account");
    }
    User target = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    if (target.getRole() == Role.ADMIN) {
      long admins = userRepository.countByRole(Role.ADMIN);
      if (admins <= 1) {
        throw new BadRequestException("Cannot delete the only admin account");
      }
    }
    userRepository.deleteById(id);
    return new MessageResponse("User deleted");
  }

  @Transactional(readOnly = true)
  public PagedResponse<TaskResponse> tasks(
      int page, int size, String q, String status, String priority, Long userId, String sort, String direction) {
    Specification<Task> spec = (root, query, cb) -> cb.conjunction();

    if (userId != null) {
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.or(
                      cb.equal(root.get("owner").get("id"), userId),
                      cb.equal(root.get("assignedTo").get("id"), userId)));
    }

    if (q != null && !q.isBlank()) {
      String term = "%" + q.trim().toLowerCase() + "%";
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.or(
                      cb.like(cb.lower(root.get("title")), term),
                      cb.like(cb.lower(root.get("description")), term)));
    }

    if (status != null && !status.isBlank()) {
      TaskStatus statusEnum = TaskStatus.valueOf(status);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
    }

    if (priority != null && !priority.isBlank()) {
      TaskPriority priorityEnum = TaskPriority.valueOf(priority);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priorityEnum));
    }

    Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    String sortField = mapAdminSortField(sort);
    var pageable = PageRequest.of(page, size, Sort.by(dir, sortField));

    var p = taskRepository.findAll(spec, pageable);
    return new PagedResponse<>(
        p.getContent().stream()
            .map(t -> taskMapper.toResponse(t, computeOverdue(t), taskActivityService.count(t)))
            .toList(),
        p.getNumber(),
        p.getSize(),
        p.getTotalElements(),
        p.getTotalPages());
  }

  public TaskResponse assign(User admin, Long id, AssignTaskRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    String oldAssignee =
        task.getAssignedTo() == null ? null : task.getAssignedTo().getEmail();
    User assigned =
        req.assignedToId() == null
            ? null
            : userRepository.findById(req.assignedToId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    task.setAssignedTo(assigned);
    task = taskRepository.save(task);
    String newAssignee = assigned == null ? null : assigned.getEmail();
    taskActivityService.log(task, admin, "UPDATED", "assignedTo", oldAssignee, newAssignee);
    if (assigned != null && !assigned.getId().equals(admin.getId())) {
      notificationService.create(
          assigned,
          "Task assigned",
          "A task was assigned to you",
          NotificationType.TASK_ASSIGNED,
          task.getId());
    }
    return taskMapper.toResponse(task, computeOverdue(task), taskActivityService.count(task));
  }

  @Transactional
  public MessageResponse bulk(User admin, BulkTaskActionRequest req) {
    if (req.taskIds() == null || req.taskIds().isEmpty()) {
      throw new BadRequestException("No tasks selected");
    }
    String action = req.action();
    if ("DELETE".equalsIgnoreCase(action)) {
      taskRepository.deleteAllById(req.taskIds());
      return new MessageResponse("Bulk delete applied");
    }
    if ("COMPLETE".equalsIgnoreCase(action)) {
      bulkSetStatus(admin, req.taskIds(), TaskStatus.COMPLETED);
      return new MessageResponse("Bulk complete applied");
    }
    if ("TODO".equalsIgnoreCase(action)) {
      bulkSetStatus(admin, req.taskIds(), TaskStatus.TODO);
      return new MessageResponse("Bulk update applied");
    }
    if ("IN_PROGRESS".equalsIgnoreCase(action)) {
      bulkSetStatus(admin, req.taskIds(), TaskStatus.IN_PROGRESS);
      return new MessageResponse("Bulk update applied");
    }
    throw new BadRequestException("Unsupported bulk action: " + action);
  }

  private void bulkSetStatus(User admin, List<Long> taskIds, TaskStatus target) {
    for (Long tid : taskIds) {
      taskRepository
          .findById(tid)
          .ifPresent(
              task -> {
                TaskStatus previous = task.getStatus();
                if (previous.equals(target)) {
                  return;
                }
                task.setStatus(target);
                task.setUpdatedAt(Instant.now());
                task = taskRepository.save(task);
                taskActivityService.log(
                    task, admin, "STATUS_CHANGED", "status", previous.name(), target.name());
                notificationService.notifyParticipantsTaskStatusChanged(task, admin);
              });
    }
  }

  @Transactional(readOnly = true)
  public Map<String, Object> stats() {
    long totalUsers = userRepository.count();
    long totalTasks = taskRepository.count();

    Map<String, Long> tasksByStatus = new LinkedHashMap<>();
    for (TaskStatus s : TaskStatus.values()) {
      tasksByStatus.put(s.name(), taskRepository.countByStatus(s));
    }

    Map<String, Long> tasksByPriority = new LinkedHashMap<>();
    for (TaskPriority p : TaskPriority.values()) {
      tasksByPriority.put(p.name(), taskRepository.countByPriority(p));
    }

    long overdueTasks =
        taskRepository.countByDueDateBeforeAndStatusNot(LocalDate.now(), TaskStatus.COMPLETED);

    List<Map<String, Object>> recentActivity = new ArrayList<>();
    List<TaskActivity> recent = taskActivityRepository.findRecentGlobal(PageRequest.of(0, 20));
    for (TaskActivity a : recent) {
      recentActivity.add(
          Map.of(
              "id",
              a.getId(),
              "taskId",
              a.getTask() != null ? a.getTask().getId() : 0L,
              "action",
              a.getAction() != null ? a.getAction() : "",
              "fieldChanged",
              a.getFieldChanged() != null ? a.getFieldChanged() : "",
              "oldValue",
              a.getOldValue() != null ? a.getOldValue() : "",
              "newValue",
              a.getNewValue() != null ? a.getNewValue() : "",
              "userName",
              a.getUser() != null && a.getUser().getName() != null ? a.getUser().getName() : "",
              "userAvatar",
              a.getUser() != null ? a.getUser().getAvatarUrl() : "",
              "taskTitle",
              a.getTask() != null && a.getTask().getTitle() != null ? a.getTask().getTitle() : "",
              "createdAt",
              a.getCreatedAt().toString()));
    }

    return Map.of(
        "totalUsers",
        totalUsers,
        "totalTasks",
        totalTasks,
        "tasksByStatus",
        tasksByStatus,
        "tasksByPriority",
        tasksByPriority,
        "overdueTasks",
        overdueTasks,
        "recentActivity",
        recentActivity);
  }

  private static String mapAdminSortField(String sort) {
    if (sort == null || sort.isBlank()) {
      return "createdAt";
    }
    return switch (sort) {
      case "dueDate" -> "dueDate";
      case "priority" -> "priority";
      case "title" -> "title";
      default -> "createdAt";
    };
  }

  private static boolean computeOverdue(Task task) {
    return task.getDueDate() != null
        && task.getDueDate().isBefore(LocalDate.now())
        && task.getStatus() != TaskStatus.COMPLETED;
  }
}
