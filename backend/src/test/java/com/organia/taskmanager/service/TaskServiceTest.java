package com.organia.taskmanager.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.TaskResponse;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.*;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
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
  @Mock TaskCommentRepository taskCommentRepository;
  @Mock TimeEntryRepository timeEntryRepository;
  @Mock LabelRepository labelRepository;
  @Mock StreakService streakService;
  TaskService service;
  User mockUser;

  @BeforeEach
  void setup() {
    service =
        new TaskService(
            taskRepository,
            userRepository,
            taskMapper,
            taskActivityService,
            notificationService,
            taskCommentRepository,
            timeEntryRepository,
            labelRepository,
            streakService);
    mockUser = User.builder().id(1L).name("Mock User").role(Role.USER).build();
    when(taskCommentRepository.countByTask_Id(anyLong())).thenReturn(0L);
    when(timeEntryRepository.sumDurationSecondsForTask(anyLong())).thenReturn(0);
    when(timeEntryRepository.findByTask_IdAndStoppedAtIsNull(anyLong())).thenReturn(Collections.emptyList());
    when(taskMapper.labelResponsesFromTask(any(Task.class))).thenReturn(List.of());
  }

  private TaskResponse sampleResponse() {
    return new TaskResponse(
        1L,
        "Task",
        null,
        "TODO",
        "MEDIUM",
        null,
        false,
        "Owner",
        null,
        null,
        null,
        null,
        0L,
        Instant.now(),
        Instant.now(),
        0L,
        List.of(),
        0,
        List.of(),
        List.of(),
        false,
        0,
        "NONE",
        null,
        false,
        null);
  }

  @Test
  void create_task() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task task =
        Task.builder()
            .id(1L)
            .title("Task")
            .owner(owner)
            .status(TaskStatus.TODO)
            .priority(TaskPriority.MEDIUM)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    when(taskRepository.save(any(Task.class))).thenReturn(task);
    when(taskMapper.toResponse(
            any(Task.class),
            anyBoolean(),
            anyLong(),
            anyLong(),
            anyList(),
            anyInt(),
            anyList(),
            anyList(),
            anyBoolean(),
            anyInt(),
            nullable(String.class)))
        .thenReturn(sampleResponse());

    var result =
        service.create(
            owner,
            new CreateTaskRequest(
                "Task", null, null, null, null, null, null, null));
    assertEquals("Task", result.title());
  }

  @Test
  void update_task() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task existing =
        Task.builder()
            .id(1L)
            .title("Old")
            .status(TaskStatus.TODO)
            .priority(TaskPriority.MEDIUM)
            .owner(owner)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
    when(taskRepository.save(any(Task.class))).thenReturn(existing);
    when(taskMapper.toResponse(
            any(Task.class),
            anyBoolean(),
            anyLong(),
            anyLong(),
            anyList(),
            anyInt(),
            anyList(),
            anyList(),
            anyBoolean(),
            anyInt(),
            nullable(String.class)))
        .thenReturn(sampleResponse());

    var result =
        service.update(owner, 1L, new UpdateTaskRequest("New", null, null, null, null, null, null));
    assertNotNull(result);
  }

  @Test
  void delete_task() {
    Task existing =
        Task.builder()
            .id(1L)
            .title("Task")
            .owner(mockUser)
            .status(TaskStatus.TODO)
            .priority(TaskPriority.MEDIUM)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));

    service.delete(mockUser, 1L);

    verify(taskActivityService).log(existing, mockUser, "DELETED", null, null, null);
    verify(taskRepository).delete(existing);
  }

  @Test
  void status_change() {
    User owner = User.builder().id(1L).name("Owner").build();
    Task existing =
        Task.builder()
            .id(1L)
            .title("Task")
            .status(TaskStatus.TODO)
            .priority(TaskPriority.MEDIUM)
            .owner(owner)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    when(taskRepository.findById(1L)).thenReturn(Optional.of(existing));
    when(taskRepository.save(any(Task.class))).thenReturn(existing);
    when(taskMapper.toResponse(
            any(Task.class),
            anyBoolean(),
            anyLong(),
            anyLong(),
            anyList(),
            anyInt(),
            anyList(),
            anyList(),
            anyBoolean(),
            anyInt(),
            nullable(String.class)))
        .thenAnswer(
            inv -> {
              Task t = inv.getArgument(0);
              return new TaskResponse(
                  t.getId(),
                  t.getTitle(),
                  t.getDescription(),
                  t.getStatus().name(),
                  t.getPriority().name(),
                  null,
                  false,
                  t.getOwner() == null ? null : t.getOwner().getName(),
                  t.getOwner() == null ? null : t.getOwner().getAvatarUrl(),
                  null,
                  null,
                  null,
                  0L,
                  Instant.now(),
                  Instant.now(),
                  0L,
                  List.of(),
                  0,
                  List.of(),
                  List.of(),
                  false,
                  0,
                  "NONE",
                  null,
                  false,
                  inv.getArgument(10));
            });

    var result = service.updateStatus(owner, 1L, new UpdateStatusRequest(TaskStatus.COMPLETED));
    assertEquals("COMPLETED", result.status());
  }

  @Test
  void assign_task_admin_flow() {
    User admin = User.builder().id(1L).name("Admin").role(Role.ADMIN).build();
    User assignee = User.builder().id(2L).name("Assignee").build();
    Task task =
        Task.builder()
            .id(1L)
            .title("Task")
            .owner(admin)
            .assignedTo(assignee)
            .status(TaskStatus.TODO)
            .priority(TaskPriority.MEDIUM)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    when(taskRepository.save(any(Task.class))).thenReturn(task);
    when(userRepository.findById(2L)).thenReturn(Optional.of(assignee));
    when(taskMapper.toResponse(
            any(Task.class),
            anyBoolean(),
            anyLong(),
            anyLong(),
            anyList(),
            anyInt(),
            anyList(),
            anyList(),
            anyBoolean(),
            anyInt(),
            nullable(String.class)))
        .thenReturn(
            new TaskResponse(
                1L,
                "Task",
                null,
                "TODO",
                "MEDIUM",
                null,
                false,
                "Admin",
                null,
                "Assignee",
                null,
                2L,
                0L,
                Instant.now(),
                Instant.now(),
                0L,
                List.of(),
                0,
                List.of(),
                List.of(),
                false,
                0,
                "NONE",
                null,
                false,
                null));

    var result =
        service.create(
            admin,
            new CreateTaskRequest(
                "Task", null, TaskStatus.TODO, TaskPriority.MEDIUM, null, 2L, null, null));
    assertEquals("Assignee", result.assignedToName());
  }
}
