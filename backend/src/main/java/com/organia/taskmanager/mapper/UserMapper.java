package com.organia.taskmanager.mapper;

import com.organia.taskmanager.dto.response.UserResponse;
import com.organia.taskmanager.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
  @Mapping(target = "role", expression = "java(user.getRole().name())")
  @Mapping(target = "isVerified", expression = "java(user.isVerified())")
  UserResponse toResponse(User user);
}
