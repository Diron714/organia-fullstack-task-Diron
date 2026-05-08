package com.organia.taskmanager.dto.request;

import com.organia.taskmanager.enums.OtpType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResendOtpRequest(
    @Email @NotBlank String email,
    @NotNull OtpType otpType
) {}
