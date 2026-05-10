package com.organia.taskmanager.scheduler;

import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.service.TaskActivityService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RecurringTaskScheduler {
  private static final Logger log = LoggerFactory.getLogger(RecurringTaskScheduler.class);
  private final TaskRepository taskRepository;
  private final TaskActivityService taskActivityService;

  @Scheduled(cron = "0 0 1 * * *")
  @Transactional
  public void spawnNextOccurrences() {
    List<Task> completedTemplates =
        taskRepository.findByRecurrenceTypeNotAndStatus(RecurrenceType.NONE, TaskStatus.COMPLETED);
    for (Task parent : completedTemplates) {
      RecurrenceType rt = parent.getRecurrenceType();
      if (rt == null || rt == RecurrenceType.NONE) {
        continue;
      }
      LocalDate anchor = parent.getDueDate();
      if (anchor == null) {
        continue;
      }
      LocalDate nextDue = nextOccurrenceOnOrAfter(anchor, rt, LocalDate.now());
      if (parent.getRecurrenceEndDate() != null && nextDue.isAfter(parent.getRecurrenceEndDate())) {
        parent.setRecurrenceType(RecurrenceType.NONE);
        taskRepository.save(parent);
        continue;
      }
      Task root = parent.getOriginalTask() != null ? parent.getOriginalTask() : parent;
      Long rootId = root.getId();
      if (taskRepository.existsByOriginalTask_IdAndDueDate(rootId, nextDue)) {
        continue;
      }

      Task child =
          Task.builder()
              .title(parent.getTitle())
              .description(parent.getDescription())
              .status(TaskStatus.TODO)
              .priority(parent.getPriority())
              .dueDate(nextDue)
              .owner(parent.getOwner())
              .assignedTo(parent.getAssignedTo())
              .createdAt(Instant.now())
              .updatedAt(Instant.now())
              .recurrenceType(rt)
              .recurrenceEndDate(parent.getRecurrenceEndDate())
              .originalTask(root)
              .build();
      taskRepository.save(child);
      if (child.getOwner() != null) {
        taskActivityService.log(child, child.getOwner(), "CREATED", null, null, null);
      }

      parent.setRecurrenceType(RecurrenceType.NONE);
      taskRepository.save(parent);

      log.info("Recurring task created: {} for {}", parent.getTitle(), nextDue);
    }
  }

  private static LocalDate nextOccurrenceOnOrAfter(LocalDate anchor, RecurrenceType rt, LocalDate minInclusive) {
    LocalDate next = bump(anchor, rt);
    while (next.isBefore(minInclusive)) {
      next = bump(next, rt);
    }
    return next;
  }

  private static LocalDate bump(LocalDate d, RecurrenceType rt) {
    return switch (rt) {
      case NONE -> d;
      case DAILY -> d.plusDays(1);
      case WEEKLY -> d.plusWeeks(1);
      case MONTHLY -> d.plusMonths(1);
    };
  }
}
