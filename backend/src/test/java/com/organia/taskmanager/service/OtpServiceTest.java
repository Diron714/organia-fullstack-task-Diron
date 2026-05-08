package com.organia.taskmanager.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.organia.taskmanager.enums.OtpType;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.RateLimitException;
import com.organia.taskmanager.repository.OtpTokenRepository;
import com.organia.taskmanager.entity.OtpToken;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {
  @Mock OtpTokenRepository repository;
  OtpService service;

  @BeforeEach
  void setup() { service = new OtpService(repository); }

  @Test
  void generate_success() {
    when(repository.countByEmailAndOtpTypeAndCreatedAtAfter(anyString(), any(), any())).thenReturn(0L);
    String otp = service.generate("a@b.com", OtpType.EMAIL_VERIFY);
    assertEquals(6, otp.length());
  }

  @Test
  void generate_rateLimit() {
    when(repository.countByEmailAndOtpTypeAndCreatedAtAfter(anyString(), any(), any())).thenReturn(3L);
    assertThrows(RateLimitException.class, () -> service.generate("a@b.com", OtpType.EMAIL_VERIFY));
  }

  @Test
  void validate_success() {
    OtpToken token = OtpToken.builder().email("a@b.com").otpCode("123456").otpType(OtpType.EMAIL_VERIFY).expiresAt(Instant.now().plusSeconds(60)).isUsed(false).build();
    when(repository.findTopByEmailAndOtpTypeAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("a@b.com", OtpType.EMAIL_VERIFY, "123456")).thenReturn(Optional.of(token));
    when(repository.save(any(OtpToken.class))).thenReturn(token);
    OtpToken result = service.validate("a@b.com", "123456", OtpType.EMAIL_VERIFY);
    assertTrue(result.isUsed());
  }

  @Test
  void validate_expired() {
    OtpToken token = OtpToken.builder().email("a@b.com").otpCode("123456").otpType(OtpType.EMAIL_VERIFY).expiresAt(Instant.now().minusSeconds(60)).isUsed(false).build();
    when(repository.findTopByEmailAndOtpTypeAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc("a@b.com", OtpType.EMAIL_VERIFY, "123456")).thenReturn(Optional.of(token));
    assertThrows(BadRequestException.class, () -> service.validate("a@b.com", "123456", OtpType.EMAIL_VERIFY));
  }
}
