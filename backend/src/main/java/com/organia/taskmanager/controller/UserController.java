package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@SecurityRequirement(name = "BearerAuth")
public class UserController {
  private final UserService userService; private final UserRepository userRepository;
  public UserController(UserService userService, UserRepository userRepository){ this.userService=userService; this.userRepository=userRepository; }
  private User current(Authentication auth){ return userRepository.findByEmail(auth.getName()).orElseThrow(); }
  @GetMapping("/me") public UserResponse me(Authentication auth){ return userService.me(current(auth)); }
  @PutMapping("/me") public UserResponse update(Authentication auth,@Valid @RequestBody UpdateProfileRequest req){ return userService.update(current(auth),req); }
  @PutMapping("/me/password") public MessageResponse password(Authentication auth,@Valid @RequestBody ChangePasswordRequest req){ return userService.changePassword(current(auth),req); }
  @DeleteMapping("/me") public MessageResponse delete(Authentication auth){ return userService.delete(current(auth)); }
}
