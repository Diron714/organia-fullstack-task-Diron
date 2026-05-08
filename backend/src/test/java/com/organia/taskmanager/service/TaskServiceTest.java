package com.organia.taskmanager.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.*;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
  @Mock TaskRepository taskRepository;
  @Mock UserRepository userRepository;
  @Mock TaskMapper taskMapper;
  @Mock TaskActivityService taskActivityService;
  @Mock NotificationService notificationService;
  TaskService service;

  @BeforeEach
  void setup() {
    service = new TaskService(taskRepository, userRepository, taskMapper, taskActivityService, notificationService);
  }

  @Test
  void create_task() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task task = Task.builder().id(1L).title("Task").owner(owner).status(TaskStatus.TODO).priority(TaskPriority.MEDIUM).createdAt(Instant.now()).updatedAt(Instant.now()).build();
    when(taskRepository.save(any(Task.class))).thenReturn(task);
    when(taskMapper.toResponse(any(Task.class), anyBoolean(), anyLong())).thenReturn(new com.organia.taskmanager.dto.response.TaskResponse(1L, "Task", null, "TODO", "MEDIUM", null, false, "Owner", null, null, 0L, Instant.now(), Instant.now()));

    var result = service.create(owner, new CreateTaskRequest("Task", null, null, null, null, null));
    assertEquals("Task", result.title());
  }

  @Test
  void update_task() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task existing = Task.builder().id(1L).title("Old").status(TaskStatus.TODO).priority(TaskPriority.MEDIUM).owner(owner).createdAt(Instant.now()).updatedAt(Instant.now()).build();
    when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
    when(taskRepository.save(any(Task.class))).thenReturn(existing);
    when(taskMapper.toResponse(any(Task.class), anyBoolean(), anyLong())).thenReturn(new com.organia.taskmanager.dto.response.TaskResponse(1L, "Old", null, "TODO", "MEDIUM", null, false, "Owner", null, null, 0L, Instant.now(), Instant.now()));

    var result = service.update(owner, 1L, new UpdateTaskRequest("New", null, null, null, null));
    assertNotNull(result);
  }

  @Test
  void delete_task() {
    service.delete(1L);
    verify(taskRepository).deleteById(1L);
  }

  @Test
  void status_change() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task existing = Task.builder().id(1L).title("Task").status(TaskStatus.TODO).priority(TaskPriority.MEDIUM).owner(owner).createdAt(Instant.now()).updatedAt(Instant.now()).build();
    when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
    when(taskRepository.save(any(Task.class))).thenReturn(existing);
    when(taskMapper.toResponse(any(Task.class), anyBoolean(), anyLong())).thenReturn(new com.organia.taskmanager.dto.response.TaskResponse(1L, "Task", null, "COMPLETED", "MEDIUM", null, false, "Owner", null, null, 0L, Instant.now(), Instant.now()));

    var result = service.updateStatus(owner, 1L, new UpdateStatusRequest(TaskStatus.COMPLETED));
    assertEquals("COMPLETED", result.status());
  }

  @Test
  void assign_task_admin_flow() {
    User owner = User.builder().id(1L).name("Owner").build();
    User assignee = User.builder().id(2L).name("Assignee").build();
    Task task = Task.builder().id(1L).title("Task").owner(owner).assignedTo(assignee).status(TaskStatus.TODO).priority(TaskPriority.MEDIUM).createdAt(Instant.now()).updatedAt(Instant.now()).build();
    when(taskRepository.save(any(Task.class))).thenReturn(task);
    when(userRepository.findById(2L)).thenReturn(Optional.of(assignee));
    when(taskMapper.toResponse(any(Task.class), anyBoolean(), anyLong())).thenReturn(new com.organia.taskmanager.dto.response.TaskResponse(1L, "Task", null, "TODO", "MEDIUM", null, false, "Owner", "Assignee", null, 0L, Instant.now(), Instant.now()));

    var result = service.create(owner, new CreateTaskRequest("Task", null, TaskStatus.TODO, TaskPriority.MEDIUM, null, 2L));
    assertEquals("Assignee", result.assignedToName());
  }
}
