package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record ForgotPasswordRequest(@Email @NotBlank String email) {}
