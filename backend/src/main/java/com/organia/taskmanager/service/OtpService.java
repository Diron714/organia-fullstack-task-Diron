package com.organia.taskmanager.service;

import com.organia.taskmanager.entity.OtpToken;
import com.organia.taskmanager.enums.OtpType;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.RateLimitException;
import com.organia.taskmanager.repository.OtpTokenRepository;
import java.time.Instant;
import java.util.Locale;
import java.util.Random;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OtpService {
  private final OtpTokenRepository otpTokenRepository;
  private final int otpExpiryMinutes;
  private final int maxOtpPerEmailPerHour;

  public OtpService(
      OtpTokenRepository otpTokenRepository,
      @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes,
      @Value("${app.otp.max-per-email-per-hour:3}") int maxOtpPerEmailPerHour) {
    this.otpTokenRepository = otpTokenRepository;
    this.otpExpiryMinutes = otpExpiryMinutes;
    this.maxOtpPerEmailPerHour = maxOtpPerEmailPerHour;
  }

  public String generate(String email, OtpType type) {
    email = normalizeEmail(email);
    long count =
        otpTokenRepository.countByEmailAndOtpTypeAndCreatedAtAfter(
            email, type, Instant.now().minusSeconds(3600));
    if (count >= maxOtpPerEmailPerHour) {
      throw new RateLimitException("OTP limit reached for this email");
    }
    String otp = String.format("%06d", new Random().nextInt(1_000_000));
    otpTokenRepository.save(
        OtpToken.builder()
            .email(email)
            .otpType(type)
            .otpCode(otp)
            .used(false)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(otpExpiryMinutes * 60L))
            .build());
    return otp;
  }

  public OtpToken validate(String email, String code, OtpType type) {
    email = normalizeEmail(email);
    code = code == null ? "" : code.trim().replaceAll("\\s+", "");
    OtpToken token =
        otpTokenRepository
            .findTopByEmailAndOtpTypeAndOtpCodeAndUsedFalseOrderByCreatedAtDesc(email, type, code)
            .orElseThrow(
                () ->
                    new BadRequestException(
                        "Invalid or expired code. Check the 6 digits, try again, or use Resend for a new code."));
    if (token.getExpiresAt().isBefore(Instant.now())) {
      throw new BadRequestException(
          "This code has expired. Use Resend to get a new verification code.");
    }
    token.setUsed(true);
    return otpTokenRepository.save(token);
  }

  private static String normalizeEmail(String email) {
    if (email == null || email.isBlank()) {
      return "";
    }
    return email.trim().toLowerCase(Locale.ROOT);
  }
}
