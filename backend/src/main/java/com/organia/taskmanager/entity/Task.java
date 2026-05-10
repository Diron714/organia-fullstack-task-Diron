package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.RecurrenceType;
import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import lombok.*;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String title;
  @Column(columnDefinition = "TEXT") private String description;
  @Enumerated(EnumType.STRING) private TaskStatus status;
  @Enumerated(EnumType.STRING) private TaskPriority priority;
  @Column(name = "due_date") private LocalDate dueDate;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id") private User owner;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assigned_to_id") private User assignedTo;
  @Column(name = "created_at") private Instant createdAt;
  @Column(name = "updated_at") private Instant updatedAt;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "task_labels",
      joinColumns = @JoinColumn(name = "task_id"),
      inverseJoinColumns = @JoinColumn(name = "label_id"))
  private Set<Label> labels = new HashSet<>();

  /** Tasks this task depends on (must complete before this task). */
  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "task_dependencies",
      joinColumns = @JoinColumn(name = "task_id"),
      inverseJoinColumns = @JoinColumn(name = "depends_on_task_id"))
  private Set<Task> dependsOn = new HashSet<>();

  /** Tasks that list this task as a dependency. */
  @ManyToMany(mappedBy = "dependsOn", fetch = FetchType.LAZY)
  private Set<Task> blockedBy = new HashSet<>();

  @Enumerated(EnumType.STRING)
  @Column(name = "recurrence_type")
  @Builder.Default
  private RecurrenceType recurrenceType = RecurrenceType.NONE;

  @Column(name = "recurrence_end_date") private LocalDate recurrenceEndDate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "original_task_id")
  private Task originalTask;
}
