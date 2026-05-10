package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.AnalyticsService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@SecurityRequirement(name = "BearerAuth")
public class AnalyticsController {
  private final AnalyticsService analyticsService;
  private final UserRepository userRepository;

  public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
    this.analyticsService = analyticsService;
    this.userRepository = userRepository;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping("/completion-trend")
  public List<DailyCompletionDto> completionTrend(
      Authentication auth,
      @RequestParam(defaultValue = "30") int days,
      @RequestParam(required = false) Long userId) {
    User u = current(auth);
    Long target = analyticsService.resolveTargetUserId(u, userId);
    return analyticsService.completionTrend(target, days);
  }

  @GetMapping("/completion-by-priority")
  public List<PriorityCompletionDto> completionByPriority(
      Authentication auth,
      @RequestParam(required = false) Integer days,
      @RequestParam(required = false) Long userId) {
    User u = current(auth);
    Long target = analyticsService.resolveTargetUserId(u, userId);
    return analyticsService.completionByPriority(target, days);
  }

  @GetMapping("/avg-completion-time")
  public List<PriorityAvgTimeDto> avgCompletionTime(
      Authentication auth,
      @RequestParam(required = false) Integer days,
      @RequestParam(required = false) Long userId) {
    User u = current(auth);
    Long target = analyticsService.resolveTargetUserId(u, userId);
    return analyticsService.avgCompletionTime(target, days);
  }

  @GetMapping("/productive-days")
  public List<DayOfWeekDto> productiveDays(
      Authentication auth,
      @RequestParam(required = false) Integer days,
      @RequestParam(required = false) Long userId) {
    User u = current(auth);
    Long target = analyticsService.resolveTargetUserId(u, userId);
    return analyticsService.productiveDays(target, days);
  }

  @GetMapping("/summary")
  public AnalyticsSummaryDto summary(
      Authentication auth,
      @RequestParam(required = false) Integer days,
      @RequestParam(required = false) Long userId) {
    User u = current(auth);
    Long target = analyticsService.resolveTargetUserId(u, userId);
    return analyticsService.summary(target, days);
  }
}
