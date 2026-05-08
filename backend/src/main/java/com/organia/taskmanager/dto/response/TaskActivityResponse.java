package com.organia.taskmanager.dto.response;
import java.time.Instant;
public record TaskActivityResponse(Long id,String action,String fieldChanged,String oldValue,String newValue,String userName,Instant createdAt) {}
