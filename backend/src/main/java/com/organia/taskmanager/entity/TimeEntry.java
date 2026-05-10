package com.organia.taskmanager.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Entity
@Table(name = "time_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeEntry {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "task_id")
  private Task task;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "started_at")
  private Instant startedAt;

  @Column(name = "stopped_at")
  private Instant stoppedAt;

  @Column(name = "duration_seconds")
  private Integer durationSeconds;

  private String note;

  @Column(name = "created_at")
  private Instant createdAt;
}
