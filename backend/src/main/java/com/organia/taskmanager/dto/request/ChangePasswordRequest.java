package com.organia.taskmanager.dto.request;
public record ChangePasswordRequest(String currentPassword,String newPassword,String confirmPassword) {}
