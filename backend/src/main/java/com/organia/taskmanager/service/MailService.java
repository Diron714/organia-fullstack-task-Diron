package com.organia.taskmanager.service;

import com.organia.taskmanager.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {
  private static final Logger log = LoggerFactory.getLogger(MailService.class);

  private final JavaMailSender sender;
  private final String fromAddress;
  private final String mailPassword;
  private final int otpExpiryMinutes;

  public MailService(
      JavaMailSender sender,
      @Value("${spring.mail.username}") String fromAddress,
      @Value("${spring.mail.password}") String mailPassword,
      @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes) {
    this.sender = sender;
    this.fromAddress = fromAddress;
    this.mailPassword = mailPassword;
    this.otpExpiryMinutes = otpExpiryMinutes;
  }

  @PostConstruct
  void validateMailConfig() {
    if (isPlaceholderMailConfig()) {
      log.warn(
          "Mail is not configured for real SMTP. Set MAIL_USERNAME and MAIL_PASSWORD (Gmail app password) "
              + "in backend/.env, or export them before starting the app. OTP emails will fail until then.");
    }
  }

  private boolean isPlaceholderMailConfig() {
    if (fromAddress == null || fromAddress.isBlank()) {
      return true;
    }
    String u = fromAddress.trim();
    if ("youremail@gmail.com".equalsIgnoreCase(u) || "your@gmail.com".equalsIgnoreCase(u)) {
      return true;
    }
    if (mailPassword == null || mailPassword.isBlank()) {
      return true;
    }
    return "your-app-password".equals(mailPassword);
  }

  public void sendOtp(String to, String subject, String otp) {
    if (fromAddress == null || fromAddress.isBlank()) {
      throw new BadRequestException(
          "Email is not configured: set MAIL_USERNAME (your Gmail address) in backend/.env or the environment.");
    }
    if (isPlaceholderMailConfig()) {
      throw new BadRequestException(
          "Email is not configured: set MAIL_USERNAME and MAIL_PASSWORD (16-character Gmail app password, no spaces) "
              + "in backend/.env next to the JAR or under the backend folder, then restart.");
    }
    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setFrom(fromAddress.trim());
    msg.setTo(to);
    msg.setSubject(subject);
    msg.setText(
        "Your Organia verification code is: "
            + otp
            + "\n\nIt expires in "
            + otpExpiryMinutes
            + " minutes. If you did not request this, ignore this email.");
    log.info("Sending OTP email from {} to {}", fromAddress, to);
    sender.send(msg);
    log.info("OTP email accepted by SMTP server for {}", to);
  }

  /** Sends in the background so registration returns immediately; failures are logged only. */
  @Async
  public void sendOtpAsync(String to, String subject, String otp) {
    try {
      sendOtp(to, subject, otp);
    } catch (Exception ex) {
      log.error("Async OTP email to {} failed (user can use Resend on verify screen)", to, ex);
    }
  }
}
