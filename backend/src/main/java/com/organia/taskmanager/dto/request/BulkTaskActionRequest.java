package com.organia.taskmanager.dto.request;
import java.util.List;
public record BulkTaskActionRequest(List<Long> taskIds,String action) {}
