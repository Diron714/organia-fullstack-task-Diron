package com.organia.taskmanager.service;

import com.organia.taskmanager.entity.OtpToken;
import com.organia.taskmanager.enums.OtpType;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.RateLimitException;
import com.organia.taskmanager.repository.OtpTokenRepository;
import java.time.Instant;
import java.util.Random;
import org.springframework.stereotype.Service;

@Service
public class OtpService {
  private final OtpTokenRepository otpTokenRepository;
  public OtpService(OtpTokenRepository otpTokenRepository) { this.otpTokenRepository = otpTokenRepository; }

  public String generate(String email, OtpType type) {
    long count = otpTokenRepository.countByEmailAndOtpTypeAndCreatedAtAfter(email, type, Instant.now().minusSeconds(3600));
    if (count >= 3) throw new RateLimitException("OTP limit reached for this email");
    String otp = String.format("%06d", new Random().nextInt(1_000_000));
    otpTokenRepository.save(OtpToken.builder().email(email).otpType(type).otpCode(otp).isUsed(false).createdAt(Instant.now()).expiresAt(Instant.now().plusSeconds(600)).build());
    return otp;
  }

  public OtpToken validate(String email, String code, OtpType type) {
    OtpToken token = otpTokenRepository.findTopByEmailAndOtpTypeAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(email, type, code)
        .orElseThrow(() -> new BadRequestException("Invalid OTP"));
    if (token.getExpiresAt().isBefore(Instant.now())) throw new BadRequestException("OTP expired");
    token.setUsed(true);
    return otpTokenRepository.save(token);
  }
}
