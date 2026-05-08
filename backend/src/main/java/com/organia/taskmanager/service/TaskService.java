package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.*;
import java.time.*;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class TaskService {
  private final TaskRepository taskRepository;
  private final UserRepository userRepository;
  private final TaskMapper taskMapper;
  private final TaskActivityService activityService;
  private final NotificationService notificationService;

  public TaskService(TaskRepository taskRepository, UserRepository userRepository, TaskMapper taskMapper,
      TaskActivityService activityService, NotificationService notificationService) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
    this.taskMapper = taskMapper;
    this.activityService = activityService;
    this.notificationService = notificationService;
  }

  public PagedResponse<TaskResponse> list(
      User current,
      int page,
      int size,
      String sort,
      String direction,
      String status,
      String priority,
      String q,
      LocalDate startDate,
      LocalDate endDate) {

    Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(dir, mapSortField(sort)));

    Specification<Task> spec = (root, query, cb) -> cb.or(
        cb.equal(root.get("owner").get("id"), current.getId()),
        cb.equal(root.get("assignedTo").get("id"), current.getId()));

    if (q != null && !q.isBlank()) {
      String term = "%" + q.trim().toLowerCase() + "%";
      spec = spec.and((root, query, cb) -> cb.or(
          cb.like(cb.lower(root.get("title")), term),
          cb.like(cb.lower(root.get("description")), term)));
    }

    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
      TaskStatus statusEnum = TaskStatus.valueOf(status);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
    }

    if (priority != null && !priority.isBlank()) {
      TaskPriority priorityEnum = TaskPriority.valueOf(priority);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priorityEnum));
    }

    if (startDate != null && endDate != null) {
      spec = spec.and((root, query, cb) -> cb.between(root.get("dueDate"), startDate, endDate));
    } else if (startDate != null) {
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), startDate));
    } else if (endDate != null) {
      spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), endDate));
    }

    Page<Task> p = taskRepository.findAll(spec, pageable);
    return new PagedResponse<>(p.getContent().stream().map(this::toResponse).toList(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
  }

  public TaskResponse create(User current, CreateTaskRequest req) {
    User assigned = null;
    if (req.assignedToId() != null) {
      if (current.getRole() != Role.ADMIN) throw new ForbiddenException("Only admin can assign tasks");
      assigned = userRepository.findById(req.assignedToId()).orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
    }

    Task task = Task.builder()
        .title(req.title())
        .description(req.description())
        .status(req.status() == null ? TaskStatus.TODO : req.status())
        .priority(req.priority() == null ? TaskPriority.MEDIUM : req.priority())
        .dueDate(req.dueDate())
        .owner(current)
        .assignedTo(assigned)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    task = taskRepository.save(task);
    activityService.log(task, current, "CREATED", null, null, null);
    if (assigned != null) {
      notificationService.create(assigned, "Task assigned", "A task was assigned to you", NotificationType.TASK_ASSIGNED, task.getId());
    }
    return toResponse(task);
  }

  public TaskResponse get(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    return toResponse(task);
  }

  public TaskResponse update(User current, Long id, UpdateTaskRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);

    if (req.title() != null) {
      activityService.log(task, current, "UPDATED", "title", task.getTitle(), req.title());
      task.setTitle(req.title());
    }
    if (req.description() != null) {
      activityService.log(task, current, "UPDATED", "description", task.getDescription(), req.description());
      task.setDescription(req.description());
    }
    if (req.status() != null) {
      activityService.log(task, current, "UPDATED", "status", task.getStatus().name(), req.status().name());
      task.setStatus(req.status());
    }
    if (req.priority() != null) {
      activityService.log(task, current, "UPDATED", "priority", task.getPriority().name(), req.priority().name());
      task.setPriority(req.priority());
    }
    if (req.dueDate() != null) {
      activityService.log(task, current, "UPDATED", "dueDate", String.valueOf(task.getDueDate()), String.valueOf(req.dueDate()));
      task.setDueDate(req.dueDate());
    }

    task.setUpdatedAt(Instant.now());
    task = taskRepository.save(task);
    return toResponse(task);
  }

  public void delete(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);
    taskRepository.delete(task);
  }

  public TaskResponse updateStatus(User current, Long id, UpdateStatusRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);

    activityService.log(task, current, "STATUS_CHANGED", "status", task.getStatus().name(), req.status().name());
    task.setStatus(req.status());
    task.setUpdatedAt(Instant.now());
    task = taskRepository.save(task);

    if (task.getAssignedTo() != null && !task.getAssignedTo().getId().equals(current.getId())) {
      notificationService.create(task.getAssignedTo(), "Task updated", "Task status changed", NotificationType.TASK_UPDATED, task.getId());
    }
    return toResponse(task);
  }

  public List<TaskActivityResponse> activity(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    return activityService.get(task);
  }

  private String mapSortField(String sort) {
    if (sort == null || sort.isBlank()) return "createdAt";
    return switch (sort) {
      case "dueDate" -> "dueDate";
      case "priority" -> "priority";
      case "title" -> "title";
      default -> "createdAt";
    };
  }

  private void assertCanView(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
    if (!(isAdmin || isOwner || isAssignee)) throw new ForbiddenException("You do not have access to this task");
  }

  private void assertCanModify(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    if (!(isAdmin || isOwner)) throw new ForbiddenException("Only owner or admin can modify this task");
  }

  private TaskResponse toResponse(Task t) {
    return taskMapper.toResponse(t,
        t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()) && t.getStatus() != TaskStatus.COMPLETED,
        activityService.count(t));
  }
}
