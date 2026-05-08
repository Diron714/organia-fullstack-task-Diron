package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record RegisterRequest(@NotBlank String name,@Email @NotBlank String email,@NotBlank String password) {}
