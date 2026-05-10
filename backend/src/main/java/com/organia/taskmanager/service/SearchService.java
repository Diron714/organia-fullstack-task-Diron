package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.Label;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TaskComment;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.LabelRepository;
import com.organia.taskmanager.repository.TaskCommentRepository;
import com.organia.taskmanager.repository.TaskRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {
  private final TaskRepository taskRepository;
  private final TaskCommentRepository commentRepository;
  private final LabelRepository labelRepository;

  public SearchService(
      TaskRepository taskRepository,
      TaskCommentRepository commentRepository,
      LabelRepository labelRepository) {
    this.taskRepository = taskRepository;
    this.commentRepository = commentRepository;
    this.labelRepository = labelRepository;
  }

  @Transactional(readOnly = true)
  public SearchResponse globalSearch(User current, String q, int limit) {
    if (q == null || q.trim().isBlank()) {
      return new SearchResponse(List.of(), List.of(), List.of());
    }
    int safeLimit = Math.min(Math.max(limit, 1), 50);
    int perBucket = Math.max(1, (safeLimit + 2) / 3);

    String term = "%" + q.trim().toLowerCase() + "%";
    boolean admin = current.getRole() == Role.ADMIN;

    Specification<Task> visible = visibleTasks(current);
    Specification<Task> textMatch =
        (root, query, cb) ->
            cb.or(
                cb.like(cb.lower(root.get("title")), term),
                cb.like(cb.lower(root.get("description")), term));

    List<Task> taskHits =
        taskRepository
            .findAll(Specification.where(visible).and(textMatch), PageRequest.of(0, perBucket))
            .getContent();

    List<TaskSearchResult> tasks =
        taskHits.stream()
            .map(
                t -> {
                  boolean overdue =
                      t.getDueDate() != null
                          && t.getDueDate().isBefore(LocalDate.now())
                          && t.getStatus() != TaskStatus.COMPLETED;
                  return new TaskSearchResult(
                      t.getId(), t.getTitle(), t.getStatus().name(), t.getPriority().name(), t.getDueDate(), overdue);
                })
            .toList();

    List<TaskComment> commentHits =
        commentRepository.searchVisible(current.getId(), admin, term, PageRequest.of(0, 3));
    List<CommentSearchResult> comments = new ArrayList<>();
    for (TaskComment c : commentHits) {
      Task task = c.getTask();
      String snippet = c.getContent();
      if (snippet.length() > 100) {
        snippet = snippet.substring(0, 100) + "…";
      }
      comments.add(
          new CommentSearchResult(
              c.getId(), snippet, task.getId(), task.getTitle(), c.getCreatedAt()));
    }

    List<Label> labelHits =
        labelRepository.searchByUser(current.getId(), term, PageRequest.of(0, perBucket));
    List<LabelSearchResult> labels =
        labelHits.stream().map(l -> new LabelSearchResult(l.getId(), l.getName(), l.getColor())).toList();

    return new SearchResponse(tasks, comments, labels);
  }

  private static Specification<Task> visibleTasks(User current) {
    if (current.getRole() == Role.ADMIN) {
      return (root, query, cb) -> cb.conjunction();
    }
    return (root, query, cb) -> {
      Predicate owner = cb.equal(root.get("owner").get("id"), current.getId());
      Predicate assignee =
          cb.and(
              cb.isNotNull(root.get("assignedTo")),
              cb.equal(root.get("assignedTo").get("id"), current.getId()));
      return cb.or(owner, assignee);
    };
  }
}
