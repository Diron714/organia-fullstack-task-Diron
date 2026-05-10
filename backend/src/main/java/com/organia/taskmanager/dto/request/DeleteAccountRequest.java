package com.organia.taskmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** User must type their account email exactly to confirm deletion. */
public record DeleteAccountRequest(@NotBlank @Email String confirmEmail) {}
