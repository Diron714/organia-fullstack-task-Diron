package com.organia.taskmanager.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddDependencyRequest(@NotNull Long dependsOnTaskId) {}
