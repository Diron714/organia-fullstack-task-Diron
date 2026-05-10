package com.organia.taskmanager.mapper;

import com.organia.taskmanager.dto.response.LabelResponse;
import com.organia.taskmanager.dto.response.TaskActivityResponse;
import com.organia.taskmanager.dto.response.TaskDependencyResponse;
import com.organia.taskmanager.dto.response.TaskResponse;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TaskActivity;
import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskStatus;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TaskMapper {

  default TaskResponse toResponse(Task t, boolean overdue, long activityCount) {
    return toResponse(t, overdue, activityCount, 0L, List.of(), 0);
  }

  default TaskResponse toResponse(
      Task t,
      boolean overdue,
      long activityCount,
      long commentCount,
      List<LabelResponse> labels,
      int totalTrackedSeconds) {
    return toResponse(
        t,
        overdue,
        activityCount,
        commentCount,
        labels,
        totalTrackedSeconds,
        List.of(),
        List.of(),
        false,
        0,
        null);
  }

  default TaskResponse toResponse(
      Task t,
      boolean overdue,
      long activityCount,
      long commentCount,
      List<LabelResponse> labels,
      int totalTrackedSeconds,
      List<TaskDependencyResponse> dependsOn,
      List<TaskDependencyResponse> blocking,
      boolean isBlocked,
      int blockedCount,
      String dependencyWarning) {
    List<LabelResponse> safeLabels = labels == null ? List.of() : labels;
    RecurrenceType rt = t.getRecurrenceType() != null ? t.getRecurrenceType() : RecurrenceType.NONE;
    String recStr = rt.name();
    boolean isRecurring = rt != RecurrenceType.NONE || t.getOriginalTask() != null;
    return new TaskResponse(
        t.getId(),
        t.getTitle(),
        t.getDescription(),
        t.getStatus().name(),
        t.getPriority().name(),
        t.getDueDate(),
        overdue,
        t.getOwner() == null ? null : t.getOwner().getName(),
        t.getOwner() == null ? null : t.getOwner().getAvatarUrl(),
        t.getAssignedTo() == null ? null : t.getAssignedTo().getName(),
        t.getAssignedTo() == null ? null : t.getAssignedTo().getAvatarUrl(),
        t.getAssignedTo() == null ? null : t.getAssignedTo().getId(),
        activityCount,
        t.getCreatedAt(),
        t.getUpdatedAt(),
        commentCount,
        safeLabels,
        totalTrackedSeconds,
        dependsOn == null ? List.of() : dependsOn,
        blocking == null ? List.of() : blocking,
        isBlocked,
        blockedCount,
        recStr,
        t.getRecurrenceEndDate(),
        isRecurring,
        dependencyWarning);
  }

  default List<LabelResponse> labelResponsesFromTask(Task t) {
    if (t.getLabels() == null || t.getLabels().isEmpty()) {
      return List.of();
    }
    return t.getLabels().stream()
        .map(l -> new LabelResponse(l.getId(), l.getName(), l.getColor()))
        .sorted(Comparator.comparing(LabelResponse::name))
        .toList();
  }

  default TaskDependencyResponse toDependencyResponse(Task x) {
    boolean done = x.getStatus() == TaskStatus.COMPLETED;
    boolean od =
        x.getDueDate() != null
            && x.getDueDate().isBefore(LocalDate.now())
            && x.getStatus() != TaskStatus.COMPLETED;
    return new TaskDependencyResponse(x.getId(), x.getTitle(), x.getStatus().name(), done, od);
  }

  default TaskActivityResponse toActivityResponse(TaskActivity activity) {
    return new TaskActivityResponse(
        activity.getId(),
        activity.getAction(),
        activity.getFieldChanged(),
        activity.getOldValue(),
        activity.getNewValue(),
        activity.getUser() == null ? null : activity.getUser().getName(),
        activity.getUser() == null ? null : activity.getUser().getAvatarUrl(),
        activity.getCreatedAt());
  }
}
