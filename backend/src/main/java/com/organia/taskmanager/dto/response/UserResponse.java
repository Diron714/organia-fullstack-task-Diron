package com.organia.taskmanager.dto.response;
public record UserResponse(Long id,String name,String email,String role,boolean isVerified,String avatarUrl) {}
