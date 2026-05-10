package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.LabelRequest;
import com.organia.taskmanager.dto.response.LabelResponse;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.LabelService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/labels")
@SecurityRequirement(name = "BearerAuth")
public class LabelController {
  private final LabelService labelService;
  private final UserRepository userRepository;

  public LabelController(LabelService labelService, UserRepository userRepository) {
    this.labelService = labelService;
    this.userRepository = userRepository;
  }

  private com.organia.taskmanager.entity.User current(Authentication auth) {
    return userRepository.findByEmail(auth.getName()).orElseThrow();
  }

  @GetMapping
  public List<LabelResponse> list(Authentication auth) {
    return labelService.list(current(auth));
  }

  @PostMapping
  public ResponseEntity<LabelResponse> create(
      Authentication auth, @Valid @RequestBody LabelRequest req) {
    return ResponseEntity.status(201).body(labelService.create(current(auth), req));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Authentication auth, @PathVariable Long id) {
    labelService.delete(current(auth), id);
    return ResponseEntity.noContent().build();
  }
}
