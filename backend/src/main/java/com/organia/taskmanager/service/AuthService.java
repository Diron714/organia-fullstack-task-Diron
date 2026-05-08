package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.*;
import com.organia.taskmanager.enums.*;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.*;
import com.organia.taskmanager.utils.PasswordValidator;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final OtpService otpService;
  private final MailService mailService;
  private final JwtService jwtService;
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserMapper userMapper;
  private final boolean cookieSecure;
  private final String cookieSameSite;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      OtpService otpService,
      MailService mailService,
      JwtService jwtService,
      RefreshTokenRepository refreshTokenRepository,
      UserMapper userMapper,
      @Value("${app.cookie.secure:false}") boolean cookieSecure,
      @Value("${app.cookie.same-site:Lax}") String cookieSameSite) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.otpService = otpService;
    this.mailService = mailService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.userMapper = userMapper;
    this.cookieSecure = cookieSecure;
    this.cookieSameSite = cookieSameSite;
  }

  public MessageResponse register(RegisterRequest req) {
    if (userRepository.existsByEmail(req.email())) throw new ConflictException("Email already exists");
    PasswordValidator.validate(req.password());
    User user = User.builder()
        .name(req.name())
        .email(req.email())
        .password(passwordEncoder.encode(req.password()))
        .role(Role.USER)
        .isVerified(false)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
    userRepository.save(user);
    String otp = otpService.generate(req.email(), OtpType.EMAIL_VERIFY);
    mailService.sendOtp(req.email(), "Verify your Organia account", otp);
    return new MessageResponse("Verification email sent");
  }

  public AuthResponse verifyEmail(OtpVerifyRequest req, HttpServletResponse response) {
    otpService.validate(req.email(), req.otpCode(), OtpType.EMAIL_VERIFY);
    User user = userRepository.findByEmail(req.email()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    user.setVerified(true);
    userRepository.save(user);

    String access = jwtService.generateAccessToken(user.getEmail());
    String refresh = jwtService.generateRefreshToken(user.getEmail());
    refreshTokenRepository.save(RefreshToken.builder()
        .token(refresh)
        .user(user)
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plusSeconds(604800))
        .build());

    addRefreshCookie(response, refresh);
    return new AuthResponse(access, userMapper.toResponse(user));
  }

  public AuthResponse login(LoginRequest req, HttpServletResponse response) {
    User user = userRepository.findByEmail(req.email()).orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    if (!user.isVerified()) throw new UnauthorizedException("Email not verified");
    if (!passwordEncoder.matches(req.password(), user.getPassword())) throw new UnauthorizedException("Invalid credentials");

    String access = jwtService.generateAccessToken(user.getEmail());
    String refresh = jwtService.generateRefreshToken(user.getEmail());
    refreshTokenRepository.save(RefreshToken.builder()
        .token(refresh)
        .user(user)
        .createdAt(Instant.now())
        .expiresAt(Instant.now().plusSeconds(604800))
        .build());

    addRefreshCookie(response, refresh);
    return new AuthResponse(access, userMapper.toResponse(user));
  }

  public MessageResponse forgotPassword(ForgotPasswordRequest req) {
    userRepository.findByEmail(req.email()).ifPresent(u -> {
      String otp = otpService.generate(req.email(), OtpType.PASSWORD_RESET);
      mailService.sendOtp(req.email(), "Reset your Organia password", otp);
    });
    return new MessageResponse("Reset OTP sent if email exists");
  }

  public MessageResponse resendOtp(ResendOtpRequest req) {
    String otp = otpService.generate(req.email(), req.otpType());
    mailService.sendOtp(req.email(), "Organia OTP", otp);
    return new MessageResponse("OTP resent");
  }

  public String verifyResetOtp(VerifyResetOtpRequest req) {
    otpService.validate(req.email(), req.otpCode(), OtpType.PASSWORD_RESET);
    return jwtService.generateAccessToken(req.email() + ":reset");
  }

  public MessageResponse resetPassword(ResetPasswordRequest req) {
    if (!req.newPassword().equals(req.confirmPassword())) throw new BadRequestException("Passwords do not match");
    PasswordValidator.validate(req.newPassword());
    if (!jwtService.isValid(req.resetToken())) throw new UnauthorizedException("Invalid reset token");

    String subject = jwtService.extractSubject(req.resetToken());
    if (!subject.endsWith(":reset")) throw new UnauthorizedException("Invalid reset token");
    String email = subject.replace(":reset", "");

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
        .expiresAt(Instant.now().plusSeconds(604800))
        .build());

    addRefreshCookie(response, newRefresh);
    return jwtService.generateAccessToken(stored.getUser().getEmail());
  }

  private void addRefreshCookie(HttpServletResponse response, String token) {
    ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
        .httpOnly(true)
        .secure(cookieSecure)
        .sameSite(cookieSameSite)
        .path("/api/auth/refresh")
        .maxAge(7 * 24 * 60 * 60)
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
}
