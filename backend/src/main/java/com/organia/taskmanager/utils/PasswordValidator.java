package com.organia.taskmanager.utils;

import com.organia.taskmanager.exception.BadRequestException;

public final class PasswordValidator {

  private PasswordValidator() {
  }

  public static void validate(String password) {
    if (password == null || password.length() < 8) {
      throw new BadRequestException("Password must be at least 8 characters long");
    }
    if (!password.matches(".*[A-Z].*")) {
      throw new BadRequestException("Password must contain at least one uppercase letter");
    }
    if (!password.matches(".*\\d.*")) {
      throw new BadRequestException("Password must contain at least one digit");
    }
    if (!password.matches(".*[!@#$%^&*].*")) {
      throw new BadRequestException("Password must contain at least one special character (!@#$%^&*)");
    }
  }
}
