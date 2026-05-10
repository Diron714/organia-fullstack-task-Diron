package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.config.JwtConfig;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.*;
import com.organia.taskmanager.utils.PasswordValidator;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AuthService {
  private static final Logger log = LoggerFactory.getLogger(AuthService.class);

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final TransactionTemplate transactionTemplate;
  private final OtpService otpService;
  private final MailService mailService;
  private final JwtService jwtService;
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserMapper userMapper;
  private final JwtConfig jwtConfig;
  private final boolean cookieSecure;
  private final String cookieSameSite;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      TransactionTemplate transactionTemplate,
      OtpService otpService,
      MailService mailService,
      JwtService jwtService,
      RefreshTokenRepository refreshTokenRepository,
      UserMapper userMapper,
      JwtConfig jwtConfig,
      @Value("${app.cookie.secure:false}") boolean cookieSecure,
      @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.transactionTemplate = transactionTemplate;
    this.otpService = otpService;
    this.mailService = mailService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.userMapper = userMapper;
    this.jwtConfig = jwtConfig;
    this.cookieSecure = cookieSecure;
    this.cookieSameSite = cookieSameSite;
  }

  /** Commits user + OTP, then queues email so the HTTP response is not blocked by SMTP. */
  public MessageResponse register(RegisterRequest req) {
    String email = normalizeEmail(req.email());
    if (email.isBlank()) {
      throw new BadRequestException("Email is required");
    }
    if (userRepository.existsByEmail(email)) {
      throw new ConflictException("Email already exists");
    }
    PasswordValidator.validate(req.password());
    User user =
        User.builder()
            .name(req.name().trim())
            .email(email)
            .password(passwordEncoder.encode(req.password()))
            .role(Role.USER)
            .verified(false)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    String otp =
        transactionTemplate.execute(
            status -> {
              userRepository.save(user);
              return otpService.generate(email, OtpType.EMAIL_VERIFY);
            });
    mailService.sendOtpAsync(email, "Verify your Organia account", otp, EmailOtpKind.REGISTER);
    return new MessageResponse("Verification email sent");
  }

  public AuthResponse verifyEmail(OtpVerifyRequest req, HttpServletResponse response) {
    String email = normalizeEmail(req.email());
    otpService.validate(email, req.otpCode(), OtpType.EMAIL_VERIFY);
    User user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    user.setVerified(true);
    userRepository.save(user);
    mailService.sendWelcomeEmailAsync(user);

    String access = jwtService.generateAccessToken(user.getEmail());
    String refresh = jwtService.generateRefreshToken(user.getEmail());
    refreshTokenRepository.save(RefreshToken.builder()
        .token(refresh)
        .user(user)
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plusMillis(jwtConfig.refreshTokenExpiryMs()))
        .build());

    addRefreshCookie(response, refresh);
    return new AuthResponse(access, userMapper.toResponse(user));
  }

  public AuthResponse login(LoginRequest req, HttpServletResponse response) {
    String email = normalizeEmail(req.email());
    User user = userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    if (!user.isVerified()) throw new UnauthorizedException("Email not verified");
    if (!passwordEncoder.matches(req.password(), user.getPassword())) throw new UnauthorizedException("Invalid credentials");

    String access = jwtService.generateAccessToken(user.getEmail());
    String refresh = jwtService.generateRefreshToken(user.getEmail());
    refreshTokenRepository.save(RefreshToken.builder()
        .token(refresh)
        .user(user)
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plusMillis(jwtConfig.refreshTokenExpiryMs()))
        .build());

    addRefreshCookie(response, refresh);
    return new AuthResponse(access, userMapper.toResponse(user));
  }

  public MessageResponse forgotPassword(ForgotPasswordRequest req) {
    String email = normalizeEmail(req.email());
    userRepository.findByEmail(email).ifPresent(u -> {
      String otp = otpService.generate(email, OtpType.PASSWORD_RESET);
      mailService.sendOtpAsync(email, "Reset your Organia password", otp, EmailOtpKind.PASSWORD_RESET);
    });
    return new MessageResponse("Reset OTP sent if email exists");
  }

  public MessageResponse resendOtp(ResendOtpRequest req) {
    String email = normalizeEmail(req.email());
    if (req.otpType() == OtpType.EMAIL_VERIFY) {
      User u =
          userRepository
              .findByEmail(email)
              .orElseThrow(() -> new BadRequestException("No account for this email"));
      if (u.isVerified()) {
        throw new BadRequestException("Email already verified");
      }
    }
    String otp = otpService.generate(email, req.otpType());
    if (req.otpType() == OtpType.PASSWORD_RESET) {
      mailService.sendOtpAsync(email, "Reset your Organia password", otp, EmailOtpKind.PASSWORD_RESET);
    } else {
      mailService.sendOtpAsync(email, "Verify your Organia account", otp, EmailOtpKind.REGISTER);
    }
    return new MessageResponse("OTP resent");
  }

  public String verifyResetOtp(VerifyResetOtpRequest req) {
    String email = normalizeEmail(req.email());
    otpService.validate(email, req.otpCode(), OtpType.PASSWORD_RESET);
    return jwtService.generateAccessToken(email + ":reset");
  }

  public MessageResponse resetPassword(ResetPasswordRequest req) {
    if (!req.newPassword().equals(req.confirmPassword())) throw new BadRequestException("Passwords do not match");
    PasswordValidator.validate(req.newPassword());
    if (!jwtService.isValid(req.resetToken())) throw new UnauthorizedException("Invalid reset token");

    String subject = jwtService.extractSubject(req.resetToken());
    if (!subject.endsWith(":reset")) throw new UnauthorizedException("Invalid reset token");
    String email = normalizeEmail(subject.replace(":reset", ""));

    User user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    user.setPassword(passwordEncoder.encode(req.newPassword()));
    userRepository.save(user);
    refreshTokenRepository.deleteByUser(user);
    return new MessageResponse("Password reset successful");
  }

  public MessageResponse logout(String refreshToken, HttpServletResponse response) {
    if (refreshToken != null) refreshTokenRepository.deleteByToken(refreshToken);
    clearRefreshCookie(response);
    return new MessageResponse("Logged out");
  }

  public String refresh(String refreshToken, HttpServletResponse response) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new UnauthorizedException("Missing refresh token");
    }

    RefreshToken stored = refreshTokenRepository.findByToken(refreshToken)
        .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
    if (stored.getExpiresAt().isBefore(Instant.now())) {
      throw new UnauthorizedException("Refresh token expired");
    }

    refreshTokenRepository.delete(stored);
    String newRefresh = jwtService.generateRefreshToken(stored.getUser().getEmail());
    refreshTokenRepository.save(RefreshToken.builder()
        .token(newRefresh)
        .user(stored.getUser())
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plusMillis(jwtConfig.refreshTokenExpiryMs()))
        .build());

    addRefreshCookie(response, newRefresh);
    return jwtService.generateAccessToken(stored.getUser().getEmail());
  }

  private void addRefreshCookie(HttpServletResponse response, String token) {
    long maxAgeSeconds = Math.max(1L, jwtConfig.refreshTokenExpiryMs() / 1000);
    ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
        .httpOnly(true)
        .secure(cookieSecure)
        .sameSite(cookieSameSite)
        .path("/api/auth/refresh")
        .maxAge(maxAgeSeconds)
        .build();
    response.addHeader("Set-Cookie", cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
        .httpOnly(true)
        .secure(cookieSecure)
        .sameSite(cookieSameSite)
        .path("/api/auth/refresh")
        .maxAge(0)
        .build();
    response.addHeader("Set-Cookie", cookie.toString());
  }

  private static String normalizeEmail(String raw) {
    if (raw == null || raw.isBlank()) {
      return "";
    }
    return raw.trim().toLowerCase(Locale.ROOT);
  }
}
