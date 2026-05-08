package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record VerifyResetOtpRequest(@Email @NotBlank String email,@NotBlank String otpCode) {}
