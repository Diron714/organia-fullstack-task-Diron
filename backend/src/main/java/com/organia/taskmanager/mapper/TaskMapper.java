package com.organia.taskmanager.mapper;

import com.organia.taskmanager.dto.response.TaskActivityResponse;
import com.organia.taskmanager.dto.response.TaskResponse;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TaskActivity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TaskMapper {
  default TaskResponse toResponse(Task t, boolean overdue, long activityCount) {
    return new TaskResponse(
        t.getId(), t.getTitle(), t.getDescription(), t.getStatus().name(), t.getPriority().name(),
        t.getDueDate(), overdue,
        t.getOwner() == null ? null : t.getOwner().getName(),
        t.getAssignedTo() == null ? null : t.getAssignedTo().getName(),
        t.getAssignedTo() == null ? null : t.getAssignedTo().getAvatarUrl(),
        activityCount,
        t.getCreatedAt(), t.getUpdatedAt());
  }

  default TaskActivityResponse toActivityResponse(TaskActivity activity) {
    return new TaskActivityResponse(activity.getId(), activity.getAction(), activity.getFieldChanged(),
        activity.getOldValue(), activity.getNewValue(),
        activity.getUser() == null ? null : activity.getUser().getName(), activity.getCreatedAt());
  }
}
