package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.TaskActivity;
import com.organia.taskmanager.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
  List<TaskActivity> findByTaskOrderByCreatedAtDesc(Task task);
  long countByTask(Task task);
}
