package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.TaskDependencyResponse;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.TaskRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskDependencyService {
  private final TaskRepository taskRepository;
  private final TaskMapper taskMapper;
  private final TaskActivityService activityService;

  public TaskDependencyService(
      TaskRepository taskRepository, TaskMapper taskMapper, TaskActivityService activityService) {
    this.taskRepository = taskRepository;
    this.taskMapper = taskMapper;
    this.activityService = activityService;
  }

  @Transactional(readOnly = true)
  public List<TaskDependencyResponse> listDependencies(User current, Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(current, task);
    if (task.getDependsOn() == null || task.getDependsOn().isEmpty()) {
      return List.of();
    }
    return task.getDependsOn().stream().map(taskMapper::toDependencyResponse).sorted((a, b) -> Long.compare(a.id(), b.id())).toList();
  }

  @Transactional
  public List<TaskDependencyResponse> addDependency(User current, Long taskId, Long dependsOnTaskId) {
    if (taskId.equals(dependsOnTaskId)) {
      throw new BadRequestException("A task cannot depend on itself");
    }
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    Task dependsOn =
        taskRepository.findById(dependsOnTaskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);
    assertCanView(current, dependsOn);

    if (task.getDependsOn().stream().anyMatch(t -> t.getId().equals(dependsOnTaskId))) {
      throw new BadRequestException("Dependency already exists");
    }

    if (wouldCreateCycle(taskId, dependsOnTaskId)) {
      throw new BadRequestException("Circular dependency");
    }

    task.getDependsOn().add(dependsOn);
    taskRepository.save(task);

    activityService.log(
        task, current, "DEPENDENCY_ADDED", "dependsOn", null, dependsOn.getTitle());
    return listDependencies(current, taskId);
  }

  /**
   * Adding edge taskId -> dependsOnTaskId creates a cycle iff dependsOnTaskId transitively depends
   * on taskId.
   */
  private boolean wouldCreateCycle(Long taskId, Long dependsOnTaskId) {
    Set<Long> visiting = new HashSet<>();
    return dependsTransitively(dependsOnTaskId, taskId, visiting);
  }

  private boolean dependsTransitively(Long currentId, Long targetId, Set<Long> visiting) {
    if (currentId.equals(targetId)) {
      return true;
    }
    if (!visiting.add(currentId)) {
      return false;
    }
    Task t = taskRepository.findById(currentId).orElseThrow();
    for (Task dep : t.getDependsOn()) {
      if (dependsTransitively(dep.getId(), targetId, visiting)) {
        return true;
      }
    }
    visiting.remove(currentId);
    return false;
  }

  @Transactional
  public void removeDependency(User current, Long taskId, Long dependsOnTaskId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanModify(current, task);
    boolean removed =
        task.getDependsOn().removeIf(d -> d.getId().equals(dependsOnTaskId));
    if (!removed) {
      throw new ResourceNotFoundException("Dependency not found");
    }
    taskRepository.save(task);
    activityService.log(task, current, "DEPENDENCY_REMOVED", "dependsOn", String.valueOf(dependsOnTaskId), null);
  }

  private static void assertCanView(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    boolean isAssignee =
        task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
    if (!(isAdmin || isOwner || isAssignee)) {
      throw new ForbiddenException("You do not have access to this task");
    }
  }

  private static void assertCanModify(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    if (!(isAdmin || isOwner)) {
      throw new ForbiddenException("Only owner or admin can modify this task");
    }
  }

  public static boolean hasIncompleteDependencies(Task task) {
    if (task.getDependsOn() == null || task.getDependsOn().isEmpty()) {
      return false;
    }
    return task.getDependsOn().stream().anyMatch(t -> t.getStatus() != TaskStatus.COMPLETED);
  }
}
