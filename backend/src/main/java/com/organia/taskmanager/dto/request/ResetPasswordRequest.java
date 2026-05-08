package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record ResetPasswordRequest(@NotBlank String resetToken,@NotBlank String newPassword,@NotBlank String confirmPassword) {}
