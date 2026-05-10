package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.TaskActivity;
import com.organia.taskmanager.entity.Task;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
  List<TaskActivity> findByTaskOrderByCreatedAtDesc(Task task);
  long countByTask(Task task);

  @Query("select distinct a from TaskActivity a join fetch a.task join fetch a.user order by a.createdAt desc")
  List<TaskActivity> findRecentGlobal(Pageable pageable);
}
