package com.organia.taskmanager.dto.request;
import jakarta.validation.constraints.*;
public record OtpVerifyRequest(@Email @NotBlank String email,@NotBlank String otpCode) {}
