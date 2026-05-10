package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.RefreshTokenRepository;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.utils.PasswordValidator;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final TaskRepository taskRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder encoder;
  private final RefreshTokenRepository refreshTokenRepository;

  public UserService(
      UserRepository userRepository,
      TaskRepository taskRepository,
      UserMapper userMapper,
      PasswordEncoder encoder,
      RefreshTokenRepository refreshTokenRepository) {
    this.userRepository = userRepository;
    this.taskRepository = taskRepository;
    this.userMapper = userMapper;
    this.encoder = encoder;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public MeProfileResponse meProfile(User user) {
    Long uid = user.getId();
    Specification<Task> involving =
        (root, query, cb) ->
            cb.or(
                cb.equal(root.get("owner").get("id"), uid),
                cb.equal(root.get("assignedTo").get("id"), uid));
    long total = taskRepository.count(involving);
    long completed =
        taskRepository.count(
            Specification.where(involving).and((r, q, cb) -> cb.equal(r.get("status"), TaskStatus.COMPLETED)));
    long overdue =
        taskRepository.count(
            Specification.where(involving)
                .and(
                    (r, q, cb) ->
                        cb.and(
                            r.get("dueDate").isNotNull(),
                            cb.lessThan(r.get("dueDate"), LocalDate.now()),
                            cb.notEqual(r.get("status"), TaskStatus.COMPLETED))));
    TaskStatsDto stats = new TaskStatsDto(total, completed, overdue);
    return new MeProfileResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole().name(),
        user.getAvatarUrl(),
        user.isVerified(),
        user.getCreatedAt(),
        stats);
  }

  public UserResponse update(User user, UpdateProfileRequest req) {
    if (req.name() != null) {
      user.setName(req.name());
    }
    if (req.avatarUrl() != null) {
      user.setAvatarUrl(req.avatarUrl());
    }
    return userMapper.toResponse(userRepository.save(user));
  }

  public MessageResponse changePassword(User user, ChangePasswordRequest req) {
    if (!encoder.matches(req.currentPassword(), user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
    if (!req.newPassword().equals(req.confirmPassword())) {
      throw new BadRequestException("Passwords do not match");
    }
    PasswordValidator.validate(req.newPassword());
    user.setPassword(encoder.encode(req.newPassword()));
    userRepository.save(user);
    refreshTokenRepository.deleteByUser(user);
    return new MessageResponse("Password changed");
  }

  public MessageResponse delete(User user, DeleteAccountRequest req) {
    String confirm =
        req.confirmEmail() == null ? "" : req.confirmEmail().trim().toLowerCase(Locale.ROOT);
    if (!confirm.equals(user.getEmail())) {
      throw new BadRequestException("Type your account email exactly to confirm deletion");
    }
    refreshTokenRepository.deleteByUser(user);
    userRepository.delete(user);
    return new MessageResponse("Account deleted");
  }
}
