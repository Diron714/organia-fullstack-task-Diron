package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
  Page<Task> findByOwnerOrAssignedTo(User owner, User assignedTo, Pageable pageable);

  long countByStatus(TaskStatus status);

  long countByPriority(TaskPriority priority);

  long countByDueDateBeforeAndStatusNot(LocalDate dueDate, TaskStatus status);
}
