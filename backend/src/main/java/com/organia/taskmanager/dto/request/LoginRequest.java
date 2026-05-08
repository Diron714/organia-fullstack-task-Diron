package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record LoginRequest(@Email @NotBlank String email,@NotBlank String password) {}
