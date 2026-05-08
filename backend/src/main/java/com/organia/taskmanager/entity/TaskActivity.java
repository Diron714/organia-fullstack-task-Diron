package com.organia.taskmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="task_activity") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaskActivity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="task_id") private Task task;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id") private User user;
  private String action;
  @Column(name="old_value") private String oldValue;
  @Column(name="new_value") private String newValue;
  @Column(name="field_changed") private String fieldChanged;
  @Column(name="created_at") private Instant createdAt;
}
