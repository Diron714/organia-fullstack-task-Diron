package com.organia.taskmanager.service;

import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.NotificationType;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.repository.TaskRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TaskDueReminderScheduler {
  private final TaskRepository taskRepository;
  private final NotificationService notificationService;
  private final MailService mailService;

  public TaskDueReminderScheduler(
      TaskRepository taskRepository, NotificationService notificationService, MailService mailService) {
    this.taskRepository = taskRepository;
    this.notificationService = notificationService;
    this.mailService = mailService;
  }

  /** Daily at 08:00 server time — notify owners and assignees about tasks due tomorrow. */
  @Scheduled(cron = "0 0 8 * * *")
  @Transactional
  public void remindTasksDueTomorrow() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    Specification<Task> spec =
        (root, query, cb) ->
            cb.and(
                cb.equal(root.get("dueDate"), tomorrow),
                cb.notEqual(root.get("status"), TaskStatus.COMPLETED));
    List<Task> tasks = taskRepository.findAll(spec);
    for (Task task : tasks) {
      notifyIfPresent(task.getOwner(), task);
      if (task.getAssignedTo() != null
          && (task.getOwner() == null || !task.getAssignedTo().getId().equals(task.getOwner().getId()))) {
        notifyIfPresent(task.getAssignedTo(), task);
      }
    }
  }

  private void notifyIfPresent(User user, Task task) {
    if (user == null) {
      return;
    }
    notificationService.create(
        user,
        "Task due tomorrow",
        "\"" + task.getTitle() + "\" is due on " + task.getDueDate() + ".",
        NotificationType.TASK_DUE,
        task.getId());
    mailService.sendDueReminderEmail(user, task);
  }
}
