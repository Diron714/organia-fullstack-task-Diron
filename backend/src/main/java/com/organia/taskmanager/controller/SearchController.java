package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.response.SearchResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.SearchService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@SecurityRequirement(name = "BearerAuth")
public class SearchController {
  private final SearchService searchService;
  private final UserRepository userRepository;

  public SearchController(SearchService searchService, UserRepository userRepository) {
    this.searchService = searchService;
    this.userRepository = userRepository;
  }

  private User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping
  public ResponseEntity<SearchResponse> globalSearch(
      Authentication auth,
      @RequestParam String q,
      @RequestParam(defaultValue = "10") int limit) {
    int capped = Math.min(Math.max(limit, 1), 50);
    return ResponseEntity.ok(searchService.globalSearch(current(auth), q, capped));
  }
}
