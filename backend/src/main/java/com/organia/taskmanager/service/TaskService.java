package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.*;
import jakarta.persistence.criteria.JoinType;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
  private final TaskRepository taskRepository;
  private final UserRepository userRepository;
  private final TaskMapper taskMapper;
  private final TaskActivityService activityService;
  private final NotificationService notificationService;
  private final TaskCommentRepository taskCommentRepository;
  private final TimeEntryRepository timeEntryRepository;
  private final LabelRepository labelRepository;
  private final StreakService streakService;

  public TaskService(
      TaskRepository taskRepository,
      UserRepository userRepository,
      TaskMapper taskMapper,
      TaskActivityService activityService,
      NotificationService notificationService,
      TaskCommentRepository taskCommentRepository,
      TimeEntryRepository timeEntryRepository,
      LabelRepository labelRepository,
      StreakService streakService) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
    this.taskMapper = taskMapper;
    this.activityService = activityService;
    this.notificationService = notificationService;
    this.taskCommentRepository = taskCommentRepository;
    this.timeEntryRepository = timeEntryRepository;
    this.labelRepository = labelRepository;
    this.streakService = streakService;
  }

  private static void validateRecurrence(CreateTaskRequest req) {
    RecurrenceType rt = req.recurrenceType() != null ? req.recurrenceType() : RecurrenceType.NONE;
    if (rt != RecurrenceType.NONE) {
      if (req.recurrenceEndDate() == null) {
        throw new BadRequestException("End date required for recurring tasks");
      }
      if (req.dueDate() != null && req.recurrenceEndDate().isBefore(req.dueDate())) {
        throw new BadRequestException("End date must be after due date");
      }
    }
  }

  private static void validateRecurrenceUpdate(Task task, UpdateTaskRequest req) {
    RecurrenceType nextRt =
        req.recurrenceType() != null
            ? req.recurrenceType()
            : (task.getRecurrenceType() != null ? task.getRecurrenceType() : RecurrenceType.NONE);
    LocalDate nextEnd =
        req.recurrenceEndDate() != null ? req.recurrenceEndDate() : task.getRecurrenceEndDate();
    LocalDate due = req.dueDate() != null ? req.dueDate() : task.getDueDate();
    if (nextRt != RecurrenceType.NONE) {
      if (nextEnd == null) {
        throw new BadRequestException("End date required for recurring tasks");
      }
      if (due != null && nextEnd.isBefore(due)) {
        throw new BadRequestException("End date must be after due date");
      }
    }
  }

  public TaskDashboardSummary dashboardSummary(User current) {
    Specification<Task> base = ownedOrAssigned(current);
    long total = taskRepository.count(base);
    long todo =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("status"), TaskStatus.TODO)));
    long inProgress =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("status"), TaskStatus.IN_PROGRESS)));
    long completed =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("status"), TaskStatus.COMPLETED)));
    long overdue =
        taskRepository.count(
            Specification.where(base)
                .and(
                    (r, q, cb) ->
                        cb.and(
                            r.get("dueDate").isNotNull(),
                            cb.lessThan(r.get("dueDate"), java.time.LocalDate.now()),
                            cb.notEqual(r.get("status"), TaskStatus.COMPLETED))));
    long priorityLow =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("priority"), TaskPriority.LOW)));
    long priorityMedium =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("priority"), TaskPriority.MEDIUM)));
    long priorityHigh =
        taskRepository.count(
            Specification.where(base).and((r, q, cb) -> cb.equal(r.get("priority"), TaskPriority.HIGH)));
    return new TaskDashboardSummary(
        total, todo, inProgress, completed, overdue, priorityLow, priorityMedium, priorityHigh);
  }

  @Transactional(readOnly = true)
  public PagedResponse<TaskResponse> list(
      User current,
      int page,
      int size,
      String sort,
      String direction,
      String status,
      String priority,
      String q,
      java.time.LocalDate startDate,
      java.time.LocalDate endDate,
      Long labelId,
      Boolean overdueOnly) {

    Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    String sortField = mapSortField(sort);
    boolean customOrder = "priority".equals(sortField) || "dueDate".equals(sortField);
    Pageable pageable =
        customOrder
            ? PageRequest.of(page, size)
            : PageRequest.of(page, size, Sort.by(dir, sortField));

    Specification<Task> spec = ownedOrAssigned(current);

    if (q != null && !q.isBlank()) {
      String term = "%" + q.trim().toLowerCase() + "%";
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.or(
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

    if (labelId != null) {
      spec =
          spec.and(
              (root, query, cb) -> {
                query.distinct(true);
                return cb.equal(root.join("labels", JoinType.INNER).get("id"), labelId);
              });
    }

    if (Boolean.TRUE.equals(overdueOnly)) {
      spec =
          spec.and(
              (root, query, cb) ->
                  cb.and(
                      root.get("dueDate").isNotNull(),
                      cb.lessThan(root.get("dueDate"), LocalDate.now()),
                      cb.notEqual(root.get("status"), TaskStatus.COMPLETED)));
    }

    if ("priority".equals(sortField)) {
      spec = spec.and(priorityOrderSpec(dir));
    } else if ("dueDate".equals(sortField)) {
      spec = spec.and(dueDateOrderSpec(dir));
    }

    Page<Task> p = taskRepository.findAll(spec, pageable);
    return new PagedResponse<>(
        p.getContent().stream().map(this::toResponse).toList(),
        p.getNumber(),
        p.getSize(),
        p.getTotalElements(),
        p.getTotalPages());
  }

  @Transactional
  public TaskResponse create(User current, CreateTaskRequest req) {
    validateRecurrence(req);
    User assigned = null;
    if (req.assignedToId() != null && current.getRole() == Role.ADMIN) {
      assigned =
          userRepository
              .findById(req.assignedToId())
              .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
    }

    RecurrenceType recurrenceType =
        req.recurrenceType() != null ? req.recurrenceType() : RecurrenceType.NONE;

    Task task =
        Task.builder()
            .title(req.title())
            .description(req.description())
            .status(req.status() == null ? TaskStatus.TODO : req.status())
            .priority(req.priority() == null ? TaskPriority.MEDIUM : req.priority())
            .dueDate(req.dueDate())
            .owner(current)
            .assignedTo(assigned)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .recurrenceType(recurrenceType)
            .recurrenceEndDate(req.recurrenceEndDate())
            .build();

    task = taskRepository.save(task);
    activityService.log(task, current, "CREATED", null, null, null);
    if (assigned != null && !assigned.getId().equals(current.getId())) {
      notificationService.create(
          assigned,
          "Task assigned",
          "A task was assigned to you",
          NotificationType.TASK_ASSIGNED,
          task.getId());
    }
    return toResponse(task);
  }

  @Transactional(readOnly = true)
  public TaskResponse get(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    return toResponse(task);
  }

  @Transactional
  public TaskResponse update(User current, Long id, UpdateTaskRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);
    validateRecurrenceUpdate(task, req);

    TaskStatus previousStatus = task.getStatus();
    boolean statusChanged = false;

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
      statusChanged = !previousStatus.equals(req.status());
      task.setStatus(req.status());
    }
    if (req.priority() != null) {
      activityService.log(task, current, "UPDATED", "priority", task.getPriority().name(), req.priority().name());
      task.setPriority(req.priority());
    }
    if (req.dueDate() != null) {
      activityService.log(
          task, current, "UPDATED", "dueDate", String.valueOf(task.getDueDate()), String.valueOf(req.dueDate()));
      task.setDueDate(req.dueDate());
    }
    if (req.recurrenceType() != null) {
      activityService.log(
          task,
          current,
          "UPDATED",
          "recurrenceType",
          String.valueOf(task.getRecurrenceType()),
          req.recurrenceType().name());
      task.setRecurrenceType(req.recurrenceType());
    }
    if (req.recurrenceEndDate() != null) {
      activityService.log(
          task,
          current,
          "UPDATED",
          "recurrenceEndDate",
          String.valueOf(task.getRecurrenceEndDate()),
          String.valueOf(req.recurrenceEndDate()));
      task.setRecurrenceEndDate(req.recurrenceEndDate());
    }

    task.setUpdatedAt(Instant.now());
    task = taskRepository.save(task);

    if (req.status() != null
        && req.status() == TaskStatus.COMPLETED
        && previousStatus != TaskStatus.COMPLETED
        && task.getOwner() != null
        && current.getId().equals(task.getOwner().getId())) {
      streakService.updateStreak(task.getOwner());
    }

    if (statusChanged) {
      notificationService.notifyParticipantsTaskStatusChanged(task, current);
    }

    task = taskRepository.findById(task.getId()).orElseThrow();
    String dependencyWarning = null;
    if (task.getStatus() == TaskStatus.IN_PROGRESS
        && TaskDependencyService.hasIncompleteDependencies(task)) {
      dependencyWarning =
          "This task has incomplete dependencies. You can still proceed.";
    }
    return toResponse(task, dependencyWarning);
  }

  @Transactional
  public void delete(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);
    activityService.log(task, current, "DELETED", null, null, null);
    taskRepository.delete(task);
  }

  @Transactional
  public TaskResponse updateStatus(User current, Long id, UpdateStatusRequest req) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);

    TaskStatus previousStatus = task.getStatus();

    activityService.log(task, current, "STATUS_CHANGED", "status", task.getStatus().name(), req.status().name());
    task.setStatus(req.status());
    task.setUpdatedAt(Instant.now());
    task = taskRepository.save(task);

    boolean becameCompleted =
        req.status() == TaskStatus.COMPLETED && previousStatus != TaskStatus.COMPLETED;
    if (becameCompleted
        && task.getOwner() != null
        && current.getId().equals(task.getOwner().getId())) {
      streakService.updateStreak(task.getOwner());
    }

    if (!previousStatus.equals(req.status())) {
      notificationService.notifyParticipantsTaskStatusChanged(task, current);
    }

    task = taskRepository.findById(task.getId()).orElseThrow();

    String dependencyWarning = null;
    if (req.status() == TaskStatus.IN_PROGRESS && TaskDependencyService.hasIncompleteDependencies(task)) {
      dependencyWarning =
          "This task has incomplete dependencies. You can still proceed.";
    }
    return toResponse(task, dependencyWarning);
  }

  public List<TaskActivityResponse> activity(User current, Long id) {
    Task task = taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    return activityService.get(task);
  }

  @Transactional
  public TaskResponse addLabelToTask(User current, Long taskId, Long labelId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    Label label = labelRepository.findById(labelId).orElseThrow(() -> new ResourceNotFoundException("Label not found"));
    if (!label.getUser().getId().equals(current.getId())) {
      throw new ForbiddenException("You cannot use this label");
    }
    task.getLabels().add(label);
    taskRepository.save(task);
    activityService.log(task, current, "LABEL_ADDED", "label", null, label.getName());
    return toResponse(task);
  }

  @Transactional
  public TaskResponse removeLabelFromTask(User current, Long taskId, Long labelId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    Label label = labelRepository.findById(labelId).orElseThrow(() -> new ResourceNotFoundException("Label not found"));
    if (!label.getUser().getId().equals(current.getId())) {
      throw new ForbiddenException("You cannot modify this label");
    }
    activityService.log(task, current, "LABEL_REMOVED", "label", label.getName(), null);
    task.getLabels().removeIf(l -> l.getId().equals(labelId));
    taskRepository.save(task);
    return toResponse(task);
  }

  @Transactional(readOnly = true)
  public byte[] exportTasksToCsv(User user) {
    Specification<Task> spec = ownedOrAssigned(user);
    Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
    List<Task> tasks = taskRepository.findAll(spec, sort);

    StringBuilder csv = new StringBuilder();
    csv.append(
        "ID,Title,Description,Status,Priority,Due Date,Owner,Assignee,Labels,Created At,Updated At\n");
    for (Task task : tasks) {
      csv.append(task.getId()).append(",");
      csv.append(escapeCsv(task.getTitle())).append(",");
      csv.append(escapeCsv(task.getDescription())).append(",");
      csv.append(task.getStatus()).append(",");
      csv.append(task.getPriority()).append(",");
      csv.append(task.getDueDate() != null ? task.getDueDate().toString() : "").append(",");
      csv.append(task.getOwner() != null ? escapeCsv(task.getOwner().getName()) : "").append(",");
      csv.append(task.getAssignedTo() != null ? escapeCsv(task.getAssignedTo().getName()) : "").append(",");
      csv.append(escapeCsv(labelsForCsv(task))).append(",");
      csv.append(task.getCreatedAt() != null ? task.getCreatedAt().toString() : "").append(",");
      csv.append(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : "").append("\n");
    }
    // BOM helps Excel detect UTF-8; fields with commas/quotes/newlines are RFC 4180–quoted.
    return ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
  }

  private static String labelsForCsv(Task task) {
    if (task.getLabels() == null || task.getLabels().isEmpty()) {
      return "";
    }
    return task.getLabels().stream()
        .map(Label::getName)
        .sorted()
        .collect(Collectors.joining("; "));
  }

  private String escapeCsv(String value) {
    if (value == null) {
      return "";
    }
    if (value.contains(",")
        || value.contains("\"")
        || value.contains("\n")
        || value.contains("\r")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private Specification<Task> ownedOrAssigned(User current) {
    return (root, query, cb) ->
        cb.or(
            cb.equal(root.get("owner").get("id"), current.getId()),
            cb.equal(root.get("assignedTo").get("id"), current.getId()));
  }

  /** LOW → MEDIUM → HIGH when ASC; HIGH → MEDIUM → LOW when DESC (semantic, not lexical). */
  private static Specification<Task> priorityOrderSpec(Sort.Direction dir) {
    return (root, query, cb) -> {
      jakarta.persistence.criteria.Expression<Integer> rank =
          cb.<Integer>selectCase()
              .when(cb.equal(root.get("priority"), TaskPriority.HIGH), 3)
              .when(cb.equal(root.get("priority"), TaskPriority.MEDIUM), 2)
              .when(cb.equal(root.get("priority"), TaskPriority.LOW), 1)
              .otherwise(0);
      if (dir == Sort.Direction.ASC) {
        query.orderBy(cb.asc(rank), cb.asc(root.get("id")));
      } else {
        query.orderBy(cb.desc(rank), cb.asc(root.get("id")));
      }
      return cb.conjunction();
    };
  }

  /** Soonest / latest due first; tasks without a due date sort last. */
  private static Specification<Task> dueDateOrderSpec(Sort.Direction dir) {
    return (root, query, cb) -> {
      var due = root.get("dueDate");
      if (dir == Sort.Direction.ASC) {
        query.orderBy(
            cb.asc(cb.coalesce(due, LocalDate.of(9999, 12, 31))), cb.asc(root.get("id")));
      } else {
        query.orderBy(
            cb.desc(cb.coalesce(due, LocalDate.of(1970, 1, 1))), cb.asc(root.get("id")));
      }
      return cb.conjunction();
    };
  }

  private String mapSortField(String sort) {
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

  private void assertCanView(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
    if (!(isAdmin || isOwner || isAssignee)) {
      throw new ForbiddenException("You do not have access to this task");
    }
  }

  private void assertCanModify(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    if (!(isAdmin || isOwner)) {
      throw new ForbiddenException("Only owner or admin can modify this task");
    }
  }

  private TaskResponse toResponse(Task t) {
    return toResponse(t, null);
  }

  private TaskResponse toResponse(Task t, String dependencyWarning) {
    boolean overdue =
        t.getDueDate() != null
            && t.getDueDate().isBefore(LocalDate.now())
            && t.getStatus() != TaskStatus.COMPLETED;
    long cc = taskCommentRepository.countByTask_Id(t.getId());
    List<LabelResponse> labels = taskMapper.labelResponsesFromTask(t);
    int tracked = computeTotalTrackedSeconds(t.getId());

    List<TaskDependencyResponse> depends =
        t.getDependsOn() == null
            ? List.of()
            : t.getDependsOn().stream()
                .map(taskMapper::toDependencyResponse)
                .sorted(Comparator.comparing(TaskDependencyResponse::id))
                .toList();
    List<TaskDependencyResponse> blocking =
        t.getBlockedBy() == null
            ? List.of()
            : t.getBlockedBy().stream()
                .map(taskMapper::toDependencyResponse)
                .sorted(Comparator.comparing(TaskDependencyResponse::id))
                .toList();

    long incompleteDeps = depends.stream().filter(d -> !d.isCompleted()).count();
    int blockedCount = (int) incompleteDeps;
    boolean isBlocked = blockedCount > 0;

    return taskMapper.toResponse(
        t,
        overdue,
        activityService.count(t),
        cc,
        labels,
        tracked,
        depends,
        blocking,
        isBlocked,
        blockedCount,
        dependencyWarning);
  }

  private int computeTotalTrackedSeconds(Long taskId) {
    Integer sum = timeEntryRepository.sumDurationSecondsForTask(taskId);
    int total = sum != null ? sum : 0;
    List<TimeEntry> open = timeEntryRepository.findByTask_IdAndStoppedAtIsNull(taskId);
    Instant now = Instant.now();
    for (TimeEntry e : open) {
      total += (int) Duration.between(e.getStartedAt(), now).getSeconds();
    }
    return total;
  }
}
