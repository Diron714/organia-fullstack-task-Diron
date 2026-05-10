package com.organia.taskmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organia.taskmanager.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
  private final ObjectMapper objectMapper;

  public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
      throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    String msg =
        authException != null && authException.getMessage() != null
            ? authException.getMessage()
            : "Authentication required";
    var body =
        new ErrorResponse(
            Instant.now().toString(),
            401,
            "Unauthorized",
            msg,
            request.getRequestURI(),
            null);
    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
