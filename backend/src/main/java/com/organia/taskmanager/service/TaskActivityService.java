package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.TaskActivityResponse;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.repository.TaskActivityRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TaskActivityService {
  private final TaskActivityRepository repository; private final TaskMapper mapper;
  public TaskActivityService(TaskActivityRepository repository, TaskMapper mapper){ this.repository=repository; this.mapper=mapper; }
  public void log(Task task, User user, String action, String field, String oldValue, String newValue){ repository.save(TaskActivity.builder().task(task).user(user).action(action).fieldChanged(field).oldValue(oldValue).newValue(newValue).createdAt(Instant.now()).build()); }
  public List<TaskActivityResponse> get(Task task){ return repository.findByTaskOrderByCreatedAtDesc(task).stream().map(mapper::toActivityResponse).toList(); }
  public long count(Task task){ return repository.countByTask(task); }
}
