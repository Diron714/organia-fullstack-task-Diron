package com.organia.taskmanager.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.organia.taskmanager.config.JwtConfig;
import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.EmailOtpKind;
import com.organia.taskmanager.enums.Role;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.*;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
  @Mock UserRepository userRepository;
  @Mock PasswordEncoder passwordEncoder;
  @Mock OtpService otpService;
  @Mock MailService mailService;
  @Mock JwtService jwtService;
  @Mock RefreshTokenRepository refreshTokenRepository;
  @Mock UserMapper userMapper;
  @Mock JwtConfig jwtConfig;
  @Mock TransactionTemplate transactionTemplate;
  @Mock HttpServletResponse response;
  AuthService authService;

  @BeforeEach
  void setup() {
    when(jwtConfig.refreshTokenExpiryMs()).thenReturn(604_800_000L);
    when(transactionTemplate.execute(any(TransactionCallback.class)))
        .thenAnswer(
            inv -> {
              TransactionCallback<?> cb = inv.getArgument(0);
              return cb.doInTransaction(null);
            });
    authService = new AuthService(
        userRepository,
        passwordEncoder,
        transactionTemplate,
        otpService,
        mailService,
        jwtService,
        refreshTokenRepository,
        userMapper,
        jwtConfig,
        false,
        "Lax");
  }

  @Test
  void register_savesUser_andSendsOtp() {
    when(userRepository.existsByEmail("a@b.com")).thenReturn(false);
    when(passwordEncoder.encode("Password1!")).thenReturn("hash");
    when(otpService.generate("a@b.com", com.organia.taskmanager.enums.OtpType.EMAIL_VERIFY)).thenReturn("123456");

    var res = authService.register(new RegisterRequest("Name", "a@b.com", "Password1!"));

    assertEquals("Verification email sent", res.message());
    verify(userRepository).save(any(User.class));
    verify(mailService).sendOtpAsync("a@b.com", "Verify your Organia account", "123456", EmailOtpKind.REGISTER);
  }

  @Test
  void verifyEmail_returnsAuthResponse() {
    User user = User.builder().email("a@b.com").role(Role.USER).build();
    when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
    when(jwtService.generateAccessToken("a@b.com")).thenReturn("access");
    when(jwtService.generateRefreshToken("a@b.com")).thenReturn("refresh");
    when(userMapper.toResponse(user)).thenReturn(new com.organia.taskmanager.dto.response.UserResponse(1L, "Name", "a@b.com", "USER", true, null));

    var res = authService.verifyEmail(new OtpVerifyRequest("a@b.com", "123456"), response);

    assertEquals("access", res.accessToken());
    verify(mailService).sendWelcomeEmailAsync(user);
  }

  @Test
  void login_success() {
    User user = User.builder().email("a@b.com").password("hash").verified(true).role(Role.USER).build();
    when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("Password1!", "hash")).thenReturn(true);
    when(jwtService.generateAccessToken("a@b.com")).thenReturn("access");
    when(jwtService.generateRefreshToken("a@b.com")).thenReturn("refresh");
    when(userMapper.toResponse(user)).thenReturn(new com.organia.taskmanager.dto.response.UserResponse(1L, "Name", "a@b.com", "USER", true, null));

    var res = authService.login(new LoginRequest("a@b.com", "Password1!"), response);
    assertEquals("access", res.accessToken());
  }

  @Test
  void forgotPassword_alwaysSuccess() {
    when(userRepository.findByEmail("x@y.com")).thenReturn(Optional.empty());
    var res = authService.forgotPassword(new ForgotPasswordRequest("x@y.com"));
    assertEquals("Reset OTP sent if email exists", res.message());
  }

  @Test
  void resetPassword_success() {
    User user = User.builder().email("a@b.com").build();
    when(jwtService.isValid("token")).thenReturn(true);
    when(jwtService.extractSubject("token")).thenReturn("a@b.com:reset");
    when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.encode("Password1!")).thenReturn("newHash");

    var res = authService.resetPassword(new ResetPasswordRequest("token", "Password1!", "Password1!"));
    assertEquals("Password reset successful", res.message());
  }
}
