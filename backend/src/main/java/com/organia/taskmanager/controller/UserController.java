package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.DashboardPreferences;
import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.ProductivityService;
import com.organia.taskmanager.service.StreakService;
import com.organia.taskmanager.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@SecurityRequirement(name = "BearerAuth")
public class UserController {
  private final UserService userService;
  private final UserRepository userRepository;
  private final ProductivityService productivityService;
  private final StreakService streakService;

  public UserController(
      UserService userService,
      UserRepository userRepository,
      ProductivityService productivityService,
      StreakService streakService) {
    this.userService = userService;
    this.userRepository = userRepository;
    this.productivityService = productivityService;
    this.streakService = streakService;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping("/me")
  public MeProfileResponse me(Authentication auth) {
    return userService.meProfile(current(auth));
  }

  @PutMapping("/me")
  public UserResponse update(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
    return userService.update(current(auth), req);
  }

  @PutMapping("/me/password")
  public MessageResponse password(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
    return userService.changePassword(current(auth), req);
  }

  @DeleteMapping("/me")
  public MessageResponse delete(Authentication auth, @Valid @RequestBody DeleteAccountRequest req) {
    return userService.delete(current(auth), req);
  }

  @GetMapping("/me/dashboard-preferences")
  public DashboardPreferences getDashboardPreferences(Authentication auth) {
    return userService.getDashboardPreferences(current(auth));
  }

  @PutMapping("/me/dashboard-preferences")
  public DashboardPreferences saveDashboardPreferences(
      Authentication auth, @RequestBody DashboardPreferences prefs) {
    return userService.saveDashboardPreferences(current(auth), prefs);
  }

  @GetMapping("/me/productivity")
  public ProductivityResponse productivity(Authentication auth) {
    return productivityService.calculateProductivity(current(auth));
  }

  @GetMapping("/me/streak")
  public StreakResponse streak(Authentication auth) {
    User u = current(auth);
    User fresh = userRepository.findById(u.getId()).orElseThrow();
    return streakService.streakFor(fresh);
  }

  @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, String> uploadAvatar(Authentication auth, @RequestPart("file") MultipartFile file)
      throws IOException {
    String url = userService.uploadAvatar(current(auth), file);
    return Map.of("avatarUrl", url);
  }
}
