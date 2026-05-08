package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="notifications") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id") private User user;
  private String title;
  @Column(columnDefinition = "TEXT") private String message;
  @Enumerated(EnumType.STRING) private NotificationType type;
  @Column(name="is_read") private boolean isRead;
  @Column(name="related_task_id") private Long relatedTaskId;
  @Column(name="created_at") private Instant createdAt;
}
