package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  @Operation(summary = "Register")
  public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest req) {
    return ResponseEntity.status(201).body(authService.register(req));
  }

  @PostMapping("/verify-email")
  public AuthResponse verifyEmail(@Valid @RequestBody OtpVerifyRequest req, HttpServletResponse res) {
    return authService.verifyEmail(req, res);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
    return authService.login(req, res);
  }

  @PostMapping("/forgot-password")
  public MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest req) {
    return authService.forgotPassword(req);
  }

  @PostMapping("/verify-reset-otp")
  public Map<String, String> verifyReset(@Valid @RequestBody VerifyResetOtpRequest req) {
    return Map.of("resetToken", authService.verifyResetOtp(req));
  }

  @PostMapping("/reset-password")
  public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest req) {
    return authService.resetPassword(req);
  }

  @PostMapping("/resend-otp")
  public MessageResponse resend(@Valid @RequestBody ResendOtpRequest req) {
    return authService.resendOtp(req);
  }

  @PostMapping("/refresh")
  public Map<String, String> refresh(HttpServletRequest request, HttpServletResponse response) {
    return Map.of("accessToken", authService.refresh(readRefresh(request), response));
  }

  @PostMapping("/logout")
  public MessageResponse logout(HttpServletRequest request, HttpServletResponse response) {
    return authService.logout(readRefresh(request), response);
  }

  private String readRefresh(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    return Arrays.stream(cookies)
        .filter(c -> "refresh_token".equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null);
  }
}
