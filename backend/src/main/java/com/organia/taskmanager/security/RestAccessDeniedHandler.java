package com.organia.taskmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organia.taskmanager.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
  private final ObjectMapper objectMapper;

  public RestAccessDeniedHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void handle(
      HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException)
      throws IOException {
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    String msg =
        accessDeniedException.getMessage() != null
            ? accessDeniedException.getMessage()
            : "You do not have permission to access this resource";
    var body =
        new ErrorResponse(
            Instant.now().toString(),
            403,
            "Forbidden",
            msg,
            request.getRequestURI(),
            null);
    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
