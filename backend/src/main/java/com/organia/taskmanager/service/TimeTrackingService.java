package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.StartTimerRequest;
import com.organia.taskmanager.dto.request.StopTimerRequest;
import com.organia.taskmanager.dto.response.TaskTimeSummary;
import com.organia.taskmanager.dto.response.TimeEntryResponse;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TimeEntry;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.TimeEntryRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TimeTrackingService {
  private final TimeEntryRepository timeEntryRepository;
  private final TaskRepository taskRepository;
  private final TaskActivityService activityService;

  public TimeTrackingService(
      TimeEntryRepository timeEntryRepository,
      TaskRepository taskRepository,
      TaskActivityService activityService) {
    this.timeEntryRepository = timeEntryRepository;
    this.taskRepository = taskRepository;
    this.activityService = activityService;
  }

  private void assertCanView(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner =
        task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    boolean isAssignee =
        task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
    if (!(isAdmin || isOwner || isAssignee)) {
      throw new ForbiddenException("You do not have access to this task");
    }
  }

  @Transactional(readOnly = true)
  public TaskTimeSummary getTimeSummary(User user, Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(user, task);

    Integer sumSec = timeEntryRepository.sumDurationSecondsForTask(taskId);
    int base = sumSec != null ? sumSec : 0;
    List<TimeEntry> open = timeEntryRepository.findByTask_IdAndStoppedAtIsNull(taskId);
    Instant now = Instant.now();
    for (TimeEntry e : open) {
      base += (int) Duration.between(e.getStartedAt(), now).getSeconds();
    }

    List<TimeEntry> all = timeEntryRepository.findByTask_IdOrderByStartedAtDesc(taskId);
    int entryCount = all.size();

    var activeForUser =
        timeEntryRepository.findByTask_IdAndUser_IdAndStoppedAtIsNull(taskId, user.getId());
    boolean hasActive = activeForUser.isPresent();
    TimeEntryResponse activeResp =
        activeForUser.map(e -> toEntryResponse(e, true)).orElse(null);

    return new TaskTimeSummary(taskId, base, entryCount, hasActive, activeResp);
  }

  @Transactional
  public TimeEntryResponse startTimer(User user, Long taskId, StartTimerRequest req) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(user, task);

    if (timeEntryRepository.findByUser_IdAndStoppedAtIsNull(user.getId()).isPresent()) {
      throw new BadRequestException("Stop your current timer first");
    }

    TimeEntry e =
        TimeEntry.builder()
            .task(task)
            .user(user)
            .startedAt(Instant.now())
            .stoppedAt(null)
            .durationSeconds(null)
            .note(req != null ? req.note() : null)
            .createdAt(Instant.now())
            .build();
    e = timeEntryRepository.save(e);
    activityService.log(task, user, "TIMER_STARTED", null, null, null);
    return toEntryResponse(e, true);
  }

  @Transactional
  public TimeEntryResponse stopTimer(User user, Long taskId, StopTimerRequest req) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(user, task);

    TimeEntry e =
        timeEntryRepository
            .findByTask_IdAndUser_IdAndStoppedAtIsNull(taskId, user.getId())
            .orElseThrow(() -> new BadRequestException("No active timer on this task"));

    Instant now = Instant.now();
    int secs = (int) Duration.between(e.getStartedAt(), now).getSeconds();
    e.setStoppedAt(now);
    e.setDurationSeconds(secs);
    if (req != null && req.note() != null && !req.note().isBlank()) {
      e.setNote(req.note());
    }
    e = timeEntryRepository.save(e);
    activityService.log(task, user, "TIMER_STOPPED", null, null, formatDuration(secs));
    return toEntryResponse(e, false);
  }

  @Transactional(readOnly = true)
  public List<TimeEntryResponse> getTimeEntries(User user, Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(user, task);
    return timeEntryRepository.findByTask_IdOrderByStartedAtDesc(taskId).stream()
        .map(
            e ->
                toEntryResponse(
                    e,
                    e.getStoppedAt() == null
                        && e.getUser().getId().equals(user.getId())))
        .toList();
  }

  private String formatDuration(int seconds) {
    int h = seconds / 3600;
    int m = (seconds % 3600) / 60;
    int s = seconds % 60;
    if (h > 0) {
      return h + "h " + m + "m";
    }
    if (m > 0) {
      return m + "m " + s + "s";
    }
    return s + "s";
  }

  private TimeEntryResponse toEntryResponse(TimeEntry e, boolean active) {
    User u = e.getUser();
    return new TimeEntryResponse(
        e.getId(),
        e.getTask().getId(),
        u.getId(),
        u.getName(),
        e.getStartedAt(),
        e.getStoppedAt(),
        e.getDurationSeconds(),
        e.getNote(),
        active);
  }
}
