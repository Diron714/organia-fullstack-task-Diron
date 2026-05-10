package com.organia.taskmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LabelRequest(
    @NotBlank String name,
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String color) {}
