package com.organia.taskmanager.service;

import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WeeklySummaryScheduler {
  private static final Logger log = LoggerFactory.getLogger(WeeklySummaryScheduler.class);

  private final UserRepository userRepository;
  private final TaskRepository taskRepository;
  private final MailService mailService;

  public WeeklySummaryScheduler(
      UserRepository userRepository, TaskRepository taskRepository, MailService mailService) {
    this.userRepository = userRepository;
    this.taskRepository = taskRepository;
    this.mailService = mailService;
  }

  @Scheduled(cron = "0 0 9 * * MON")
  public void sendWeeklySummaries() {
    List<User> allUsers = userRepository.findAll();
    for (User user : allUsers) {
      try {
        sendSummaryForUser(user);
      } catch (Exception e) {
        log.warn("Failed to send weekly summary to {}: {}", user.getEmail(), e.getMessage());
      }
    }
  }

  private void sendSummaryForUser(User user) {
    if (!user.isVerified()) {
      return;
    }
    LocalDate weekStart = LocalDate.now().minusWeeks(1).with(DayOfWeek.MONDAY);
    LocalDate weekEnd = weekStart.with(DayOfWeek.SUNDAY);
    LocalDate today = LocalDate.now();
    LocalDate nextWeekEnd = today.with(DayOfWeek.SUNDAY);

    Long uid = user.getId();

    int completedLastWeek = (int) taskRepository.countCompletedBetween(uid, weekStart, weekEnd);

    int overdueCount =
        (int) taskRepository.countByOwner_IdAndStatusNotAndDueDateBefore(uid, TaskStatus.COMPLETED, today);

    List<Task> dueSoon =
        taskRepository.findDueSoonForOwner(
            uid, TaskStatus.COMPLETED, today, nextWeekEnd, PageRequest.of(0, 5));

    mailService.sendWeeklySummaryEmail(user, completedLastWeek, overdueCount, dueSoon, weekStart, weekEnd);
  }
}
