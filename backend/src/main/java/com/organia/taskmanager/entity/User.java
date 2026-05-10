package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String name;
  @Column(unique = true) private String email;
  private String password;
  @Enumerated(EnumType.STRING) private Role role;
  /** Persisted as {@code is_verified}; use {@code verified} as field name to avoid Lombok/Hibernate issues with {@code is*} booleans. */
  @Column(name = "is_verified")
  private boolean verified;
  @Column(name = "avatar_url")
  private String avatarUrl;
  @Column(name="created_at") private Instant createdAt;
  @Column(name="updated_at") private Instant updatedAt;

  @Column(name = "dashboard_preferences", columnDefinition = "JSON")
  private String dashboardPreferences;

  @Column(name = "current_streak")
  @Builder.Default
  private int currentStreak = 0;

  @Column(name = "longest_streak")
  @Builder.Default
  private int longestStreak = 0;

  @Column(name = "last_completion_date")
  private LocalDate lastCompletionDate;
}
