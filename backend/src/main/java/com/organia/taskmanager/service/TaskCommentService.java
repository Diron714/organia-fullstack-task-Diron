package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.CreateCommentRequest;
import com.organia.taskmanager.dto.response.CommentResponse;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.TaskComment;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.repository.TaskCommentRepository;
import com.organia.taskmanager.repository.TaskRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskCommentService {
  private final TaskCommentRepository commentRepository;
  private final TaskRepository taskRepository;
  private final TaskActivityService activityService;

  public TaskCommentService(
      TaskCommentRepository commentRepository,
      TaskRepository taskRepository,
      TaskActivityService activityService) {
    this.commentRepository = commentRepository;
    this.taskRepository = taskRepository;
    this.activityService = activityService;
  }

  private void assertCanView(User current, Task task) {
    boolean isAdmin = current.getRole() == Role.ADMIN;
    boolean isOwner = task.getOwner() != null && task.getOwner().getId().equals(current.getId());
    boolean isAssignee =
        task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
    if (!(isAdmin || isOwner || isAssignee)) {
      throw new ForbiddenException("You do not have access to this task");
    }
  }

  @Transactional
  public CommentResponse addComment(User currentUser, Long taskId, CreateCommentRequest request) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(currentUser, task);

    TaskComment c =
        TaskComment.builder()
            .task(task)
            .user(currentUser)
            .content(request.content().trim())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    c = commentRepository.save(c);
    activityService.log(task, currentUser, "COMMENT", null, null, null);

    return toResponse(c, currentUser.getId());
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> getComments(User currentUser, Long taskId) {
    Task task = taskRepository.findById(taskId).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    assertCanView(currentUser, task);
    return commentRepository.findByTask_IdOrderByCreatedAtAsc(taskId).stream()
        .map(c -> toResponse(c, currentUser.getId()))
        .toList();
  }

  @Transactional
  public void deleteComment(User currentUser, Long taskId, Long commentId) {
    TaskComment c =
        commentRepository.findById(commentId).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    Task task = c.getTask();
    if (!task.getId().equals(taskId)) {
      throw new ResourceNotFoundException("Comment not found");
    }
    boolean canDelete =
        c.getUser().getId().equals(currentUser.getId()) || currentUser.getRole() == Role.ADMIN;
    if (!canDelete) {
      throw new ForbiddenException("You cannot delete this comment");
    }
    assertCanView(currentUser, task);
    commentRepository.delete(c);
  }

  private CommentResponse toResponse(TaskComment c, Long currentUserId) {
    User u = c.getUser();
    return new CommentResponse(
        c.getId(),
        c.getTask().getId(),
        u.getId(),
        u.getName(),
        u.getAvatarUrl(),
        c.getContent(),
        c.getCreatedAt(),
        u.getId().equals(currentUserId));
  }
}
