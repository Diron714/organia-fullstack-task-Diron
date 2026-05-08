package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.RefreshTokenRepository;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.utils.PasswordValidator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder encoder;
  private final RefreshTokenRepository refreshTokenRepository;

  public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder encoder, RefreshTokenRepository refreshTokenRepository) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;
    this.encoder = encoder;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public UserResponse me(User user) {
    return userMapper.toResponse(user);
  }

  public UserResponse update(User user, UpdateProfileRequest req) {
    if (req.name() != null) user.setName(req.name());
    if (req.avatarUrl() != null) user.setAvatarUrl(req.avatarUrl());
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

  public MessageResponse delete(User user) {
    refreshTokenRepository.deleteByUser(user);
    userRepository.delete(user);
    return new MessageResponse("Account deleted");
  }
}
