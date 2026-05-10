package com.organia.taskmanager.entity;

import com.organia.taskmanager.enums.OtpType;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="otp_tokens") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  private String email;
  @Column(name="otp_code") private String otpCode;
  @Enumerated(EnumType.STRING) @Column(name="otp_type") private OtpType otpType;
  @Column(name="expires_at") private Instant expiresAt;
  /** Persisted as {@code is_used}; field name {@code used} avoids Lombok/JavaBeans issues with {@code is*} booleans and Spring Data {@code UsedFalse} queries. */
  @Column(name = "is_used")
  private boolean used;
  @Column(name="created_at") private Instant createdAt;
}
