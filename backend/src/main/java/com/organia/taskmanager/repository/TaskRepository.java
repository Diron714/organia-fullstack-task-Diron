package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
  Page<Task> findByOwnerOrAssignedTo(User owner, User assignedTo, Pageable pageable);

  long countByStatus(TaskStatus status);

  long countByPriority(TaskPriority priority);

  long countByDueDateBeforeAndStatusNot(LocalDate dueDate, TaskStatus status);

  List<Task> findByOwner_IdAndDueDateBetween(Long ownerId, LocalDate start, LocalDate end);

  List<Task> findByOwner_IdAndStatusAndDueDateBetween(
      Long ownerId, TaskStatus status, LocalDate start, LocalDate end);

  long countByOwner_IdAndDueDateBetween(Long ownerId, LocalDate start, LocalDate end);

  long countByOwner_IdAndStatusAndDueDateBetween(
      Long ownerId, TaskStatus status, LocalDate start, LocalDate end);

  long countByOwner_IdAndStatusNotAndDueDateBefore(Long ownerId, TaskStatus status, LocalDate date);

  @Query(
      "SELECT t FROM Task t WHERE t.owner.id = :uid AND t.status <> :completed "
          + "AND t.dueDate IS NOT NULL AND t.dueDate BETWEEN :start AND :end ORDER BY t.dueDate ASC")
  List<Task> findDueSoonForOwner(
      @Param("uid") Long uid,
      @Param("completed") TaskStatus completed,
      @Param("start") LocalDate start,
      @Param("end") LocalDate end,
      Pageable pageable);

  List<Task> findByRecurrenceTypeNotAndStatus(RecurrenceType excludedType, TaskStatus status);

  boolean existsByOriginalTask_IdAndDueDate(Long originalTaskId, LocalDate dueDate);

  long countByOwner_Id(Long ownerId);

  long countByOwner_IdAndStatus(Long ownerId, TaskStatus status);

  @Query(
      value =
          "SELECT COUNT(*) FROM tasks WHERE owner_id = :uid AND DATE(created_at) = DATE(:day)",
      nativeQuery = true)
  long countCreatedOnDay(@Param("uid") Long uid, @Param("day") LocalDate day);

  @Query(
      value =
          "SELECT COUNT(*) FROM tasks WHERE owner_id = :uid AND status = 'COMPLETED' "
              + "AND DATE(updated_at) = DATE(:day)",
      nativeQuery = true)
  long countCompletedOnDay(@Param("uid") Long uid, @Param("day") LocalDate day);

  @Query(
      value =
          "SELECT priority, COUNT(*), SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) "
              + "FROM tasks WHERE owner_id = :uid GROUP BY priority",
      nativeQuery = true)
  List<Object[]> statsByPriorityRaw(@Param("uid") Long uid);

  @Query(
      value =
          "SELECT priority, COUNT(*), SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) "
              + "FROM tasks WHERE owner_id = :uid AND DATE(created_at) BETWEEN :start AND :end "
              + "GROUP BY priority",
      nativeQuery = true)
  List<Object[]> statsByPriorityRawInRange(
      @Param("uid") Long uid, @Param("start") LocalDate start, @Param("end") LocalDate end);

  @Query(
      value =
          "SELECT priority, AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) "
              + "FROM tasks WHERE owner_id = :uid AND status = 'COMPLETED' GROUP BY priority",
      nativeQuery = true)
  List<Object[]> avgCompletionSecondsByPriorityRaw(@Param("uid") Long uid);

  @Query(
      value =
          "SELECT priority, AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) "
              + "FROM tasks WHERE owner_id = :uid AND status = 'COMPLETED' "
              + "AND DATE(updated_at) BETWEEN :start AND :end GROUP BY priority",
      nativeQuery = true)
  List<Object[]> avgCompletionSecondsByPriorityRawInRange(
      @Param("uid") Long uid, @Param("start") LocalDate start, @Param("end") LocalDate end);

  @Query(
      value =
          "SELECT DAYOFWEEK(updated_at), COUNT(*) FROM tasks WHERE owner_id = :uid "
              + "AND status = 'COMPLETED' GROUP BY DAYOFWEEK(updated_at)",
      nativeQuery = true)
  List<Object[]> completedByDayOfWeekRaw(@Param("uid") Long uid);

  @Query(
      value =
          "SELECT DAYOFWEEK(updated_at), COUNT(*) FROM tasks WHERE owner_id = :uid "
              + "AND status = 'COMPLETED' AND DATE(updated_at) BETWEEN :start AND :end "
              + "GROUP BY DAYOFWEEK(updated_at)",
      nativeQuery = true)
  List<Object[]> completedByDayOfWeekRawInRange(
      @Param("uid") Long uid, @Param("start") LocalDate start, @Param("end") LocalDate end);

  @Query(
      value =
          "SELECT COUNT(*) FROM tasks WHERE owner_id = :uid "
              + "AND DATE(created_at) BETWEEN :start AND :end",
      nativeQuery = true)
  long countCreatedBetween(
      @Param("uid") Long uid, @Param("start") LocalDate start, @Param("end") LocalDate end);

  @Query(
      value =
          "SELECT COUNT(*) FROM tasks WHERE owner_id = :uid AND status = 'COMPLETED' "
              + "AND DATE(updated_at) BETWEEN :start AND :end",
      nativeQuery = true)
  long countCompletedBetween(
      @Param("uid") Long uid, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
