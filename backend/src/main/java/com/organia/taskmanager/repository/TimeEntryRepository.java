package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.TimeEntry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
  List<TimeEntry> findByTask_IdOrderByStartedAtDesc(Long taskId);

  List<TimeEntry> findByTask_IdAndStoppedAtIsNull(Long taskId);

  Optional<TimeEntry> findByTask_IdAndUser_IdAndStoppedAtIsNull(Long taskId, Long userId);

  Optional<TimeEntry> findByUser_IdAndStoppedAtIsNull(Long userId);

  @Query(
      "SELECT COALESCE(SUM(t.durationSeconds), 0) FROM TimeEntry t WHERE t.task.id = :taskId AND t.durationSeconds IS NOT NULL")
  Integer sumDurationSecondsForTask(@Param("taskId") Long taskId);
}
