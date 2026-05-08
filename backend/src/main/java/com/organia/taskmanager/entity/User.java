package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String name;
  @Column(unique = true) private String email;
  private String password;
  @Enumerated(EnumType.STRING) private Role role;
  @Column(name="is_verified") private boolean isVerified;
  @Column(name="avatar_url") private String avatarUrl;
  @Column(name="created_at") private Instant createdAt;
  @Column(name="updated_at") private Instant updatedAt;
}
