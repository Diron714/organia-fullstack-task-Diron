package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {
  private static final String[] MYSQL_DOW =
      new String[] {"", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};

  private final TaskRepository taskRepository;
  private final UserRepository userRepository;

  public AnalyticsService(TaskRepository taskRepository, UserRepository userRepository) {
    this.taskRepository = taskRepository;
    this.userRepository = userRepository;
  }

  public Long resolveTargetUserId(User current, Long requestedUserId) {
    if (requestedUserId != null && current.getRole() == Role.ADMIN) {
      return requestedUserId;
    }
    return current.getId();
  }

  private static LocalDate rangeStartInclusive(int days) {
    LocalDate end = LocalDate.now();
    return end.minusDays(Math.max(1, days) - 1L);
  }

  @Transactional(readOnly = true)
  public List<DailyCompletionDto> completionTrend(Long ownerId, int days) {
    LocalDate end = LocalDate.now();
    LocalDate start = rangeStartInclusive(days);
    List<DailyCompletionDto> out = new ArrayList<>();
    DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
    for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
      long created = taskRepository.countCreatedOnDay(ownerId, d);
      long completed = taskRepository.countCompletedOnDay(ownerId, d);
      out.add(new DailyCompletionDto(d.format(fmt), completed, created));
    }
    return out;
  }

  @Transactional(readOnly = true)
  public List<PriorityCompletionDto> completionByPriority(Long ownerId, Integer days) {
    List<Object[]> rows =
        (days != null && days > 0)
            ? taskRepository.statsByPriorityRawInRange(
                ownerId, rangeStartInclusive(days), LocalDate.now())
            : taskRepository.statsByPriorityRaw(ownerId);
    return mapPriorityCompletion(rows);
  }

  private List<PriorityCompletionDto> mapPriorityCompletion(List<Object[]> rows) {
    List<PriorityCompletionDto> list = new ArrayList<>();
    for (Object[] row : rows) {
      String priority = String.valueOf(row[0]);
      long total = ((Number) row[1]).longValue();
      long completed = ((Number) row[2]).longValue();
      double rate = total == 0 ? 0.0 : (completed * 100.0 / total);
      list.add(new PriorityCompletionDto(priority, total, completed, Math.round(rate * 10.0) / 10.0));
    }
    list.sort(Comparator.comparing(PriorityCompletionDto::priority));
    return list;
  }

  @Transactional(readOnly = true)
  public List<PriorityAvgTimeDto> avgCompletionTime(Long ownerId, Integer days) {
    List<Object[]> rows =
        (days != null && days > 0)
            ? taskRepository.avgCompletionSecondsByPriorityRawInRange(
                ownerId, rangeStartInclusive(days), LocalDate.now())
            : taskRepository.avgCompletionSecondsByPriorityRaw(ownerId);
    return mapAvgTime(rows);
  }

  private List<PriorityAvgTimeDto> mapAvgTime(List<Object[]> rows) {
    List<PriorityAvgTimeDto> list = new ArrayList<>();
    for (Object[] row : rows) {
      if (row[0] == null || row[1] == null) {
        continue;
      }
      String priority = String.valueOf(row[0]);
      double secs = ((Number) row[1]).doubleValue();
      double dayVal = secs / 86400.0;
      list.add(new PriorityAvgTimeDto(priority, Math.round(dayVal * 10.0) / 10.0));
    }
    list.sort(Comparator.comparing(PriorityAvgTimeDto::priority));
    return list;
  }

  @Transactional(readOnly = true)
  public List<DayOfWeekDto> productiveDays(Long ownerId, Integer days) {
    List<Object[]> rows =
        (days != null && days > 0)
            ? taskRepository.completedByDayOfWeekRawInRange(
                ownerId, rangeStartInclusive(days), LocalDate.now())
            : taskRepository.completedByDayOfWeekRaw(ownerId);
    List<DayOfWeekDto> list = new ArrayList<>();
    for (Object[] row : rows) {
      int dow = ((Number) row[0]).intValue();
      long cnt = ((Number) row[1]).longValue();
      String label = dow >= 1 && dow <= 7 ? MYSQL_DOW[dow] : "UNKNOWN";
      list.add(new DayOfWeekDto(label, cnt));
    }
    list.sort(Comparator.comparing(DayOfWeekDto::dayOfWeek));
    return list;
  }

  @Transactional(readOnly = true)
  public AnalyticsSummaryDto summary(Long ownerId, Integer days) {
    if (days == null || days <= 0) {
      return summaryAllTime(ownerId);
    }
    return summaryForRange(ownerId, days);
  }

  private AnalyticsSummaryDto summaryAllTime(Long ownerId) {
    User u = userRepository.findById(ownerId).orElseThrow();
    long ownedTotal = taskRepository.countByOwner_Id(ownerId);
    long ownedCompleted = taskRepository.countByOwner_IdAndStatus(ownerId, TaskStatus.COMPLETED);

    long overdue =
        taskRepository.countByOwner_IdAndStatusNotAndDueDateBefore(
            ownerId, TaskStatus.COMPLETED, LocalDate.now());

    double completionRate = ownedTotal == 0 ? 0.0 : (ownedCompleted * 100.0 / ownedTotal);

    List<PriorityAvgTimeDto> avgTimes = avgCompletionTime(ownerId, null);
    double avgDays =
        avgTimes.stream().mapToDouble(PriorityAvgTimeDto::avgDays).average().orElse(0.0);

    List<DayOfWeekDto> dow = productiveDays(ownerId, null);
    String bestDay =
        dow.stream()
            .max(Comparator.comparingLong(DayOfWeekDto::completed))
            .map(DayOfWeekDto::dayOfWeek)
            .orElse("");

    return new AnalyticsSummaryDto(
        ownedTotal,
        ownedCompleted,
        overdue,
        Math.round(completionRate * 10.0) / 10.0,
        Math.round(avgDays * 10.0) / 10.0,
        bestDay,
        u.getLongestStreak(),
        u.getCurrentStreak());
  }

  private AnalyticsSummaryDto summaryForRange(Long ownerId, int days) {
    User u = userRepository.findById(ownerId).orElseThrow();
    LocalDate end = LocalDate.now();
    LocalDate start = rangeStartInclusive(days);

    long created = taskRepository.countCreatedBetween(ownerId, start, end);
    long completed = taskRepository.countCompletedBetween(ownerId, start, end);

    long overdue =
        taskRepository.countByOwner_IdAndStatusNotAndDueDateBefore(
            ownerId, TaskStatus.COMPLETED, LocalDate.now());

    double completionRate =
        created == 0
            ? (completed == 0 ? 0.0 : 100.0)
            : Math.min(100.0, Math.round((completed * 100.0 / created) * 10.0) / 10.0);

    List<PriorityAvgTimeDto> avgTimes = avgCompletionTime(ownerId, days);
    double avgDays =
        avgTimes.stream().mapToDouble(PriorityAvgTimeDto::avgDays).average().orElse(0.0);

    List<DayOfWeekDto> dow = productiveDays(ownerId, days);
    String bestDay =
        dow.stream()
            .max(Comparator.comparingLong(DayOfWeekDto::completed))
            .map(DayOfWeekDto::dayOfWeek)
            .orElse("");

    return new AnalyticsSummaryDto(
        created,
        completed,
        overdue,
        completionRate,
        Math.round(avgDays * 10.0) / 10.0,
        bestDay,
        u.getLongestStreak(),
        u.getCurrentStreak());
  }
}
