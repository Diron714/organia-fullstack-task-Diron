package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.TaskPriority;
import com.organia.taskmanager.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name="tasks") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Task {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String title;
  @Column(columnDefinition = "TEXT") private String description;
  @Enumerated(EnumType.STRING) private TaskStatus status;
  @Enumerated(EnumType.STRING) private TaskPriority priority;
  @Column(name="due_date") private LocalDate dueDate;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="owner_id") private User owner;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="assigned_to_id") private User assignedTo;
  @Column(name="created_at") private Instant createdAt;
  @Column(name="updated_at") private Instant updatedAt;
}
