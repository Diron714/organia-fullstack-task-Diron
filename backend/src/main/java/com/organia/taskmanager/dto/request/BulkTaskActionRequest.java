package com.organia.taskmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkTaskActionRequest(@NotEmpty List<Long> taskIds, @NotBlank String action) {}
