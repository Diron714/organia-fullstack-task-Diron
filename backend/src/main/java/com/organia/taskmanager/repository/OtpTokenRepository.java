package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.OtpToken;
import com.organia.taskmanager.enums.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
  Optional<OtpToken> findTopByEmailAndOtpTypeAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(String email, OtpType otpType, String otpCode);
  long countByEmailAndOtpTypeAndCreatedAtAfter(String email, OtpType otpType, Instant createdAt);

  long countByEmailAndCreatedAtAfter(String email, Instant createdAt);
}
