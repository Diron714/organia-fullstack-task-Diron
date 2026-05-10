package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.ProductivityResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.TaskRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class ProductivityService {
  private final TaskRepository taskRepository;

  public ProductivityService(TaskRepository taskRepository) {
    this.taskRepository = taskRepository;
  }

  public ProductivityResponse calculateProductivity(User user) {
    LocalDate today = LocalDate.now();
    LocalDate thisWeekStart = today.with(DayOfWeek.MONDAY);
    LocalDate thisWeekEnd = today.with(DayOfWeek.SUNDAY);
    LocalDate lastWeekStart = thisWeekStart.minusWeeks(1);
    LocalDate lastWeekEnd = thisWeekEnd.minusWeeks(1);

    Long uid = user.getId();

    int tasksDueThisWeek =
        (int) taskRepository.countByOwner_IdAndDueDateBetween(uid, thisWeekStart, thisWeekEnd);

    int tasksCompletedThisWeek =
        (int) taskRepository.countCompletedBetween(uid, thisWeekStart, thisWeekEnd);

    int weeklyScore =
        tasksDueThisWeek == 0
            ? (tasksCompletedThisWeek > 0 ? 100 : 0)
            : Math.min(100, tasksCompletedThisWeek * 100 / tasksDueThisWeek);

    int lastWeekDue =
        (int) taskRepository.countByOwner_IdAndDueDateBetween(uid, lastWeekStart, lastWeekEnd);
    int lastWeekCompleted =
        (int) taskRepository.countCompletedBetween(uid, lastWeekStart, lastWeekEnd);

    int lastWeekScore =
        lastWeekDue == 0
            ? (lastWeekCompleted > 0 ? 100 : 0)
            : Math.min(100, lastWeekCompleted * 100 / lastWeekDue);

    String trend =
        weeklyScore > lastWeekScore ? "UP" : weeklyScore < lastWeekScore ? "DOWN" : "SAME";

    int tasksOverdue =
        (int)
            taskRepository.countByOwner_IdAndStatusNotAndDueDateBefore(
                uid, TaskStatus.COMPLETED, today);

    String message = buildMessage(user, weeklyScore, tasksOverdue);

    return new ProductivityResponse(
        weeklyScore,
        tasksCompletedThisWeek,
        tasksDueThisWeek,
        tasksOverdue,
        trend,
        lastWeekScore,
        message);
  }

  private static String buildMessage(User user, int weeklyScore, int tasksOverdue) {
    String base =
        weeklyScore >= 90
            ? "Outstanding — you're clearing the week with room to spare."
            : weeklyScore >= 70
                ? "Great work. Keep the rhythm through Friday."
                : weeklyScore >= 50
                    ? "Solid progress. A focused push will push you into the green."
                    : weeklyScore >= 30
                        ? "You're in motion. Prioritize what's due soon."
                        : "Reset the week: one completion at a time counts.";

    StringBuilder sb = new StringBuilder(base);
    int streak = user.getCurrentStreak();
    if (streak >= 14) {
      sb.append(" Your ")
          .append(streak)
          .append("-day streak shows serious consistency.");
    } else if (streak >= 7) {
      sb.append(" That ").append(streak).append("-day streak is a real advantage.");
    } else if (streak >= 3) {
      sb.append(" Protect your streak — tomorrow matters.");
    }
    if (tasksOverdue > 0 && weeklyScore < 70) {
      sb.append(" Closing overdue tasks will lift this score fast.");
    }
    return sb.toString();
  }
}
