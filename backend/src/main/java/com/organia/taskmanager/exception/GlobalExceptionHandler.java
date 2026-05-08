package com.organia.taskmanager.exception;

import com.organia.taskmanager.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    Map<String, String> fields = new HashMap<>();
    for (FieldError e : ex.getBindingResult().getFieldErrors()) {
      fields.put(e.getField(), e.getDefaultMessage());
    }
    return ResponseEntity.badRequest()
        .body(new ErrorResponse(Instant.now().toString(), 400, "Bad Request", "Validation failed",
            req.getRequestURI(), fields));
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException ex, HttpServletRequest req) {
    return build(404, "Not Found", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ErrorResponse> conflict(ConflictException ex, HttpServletRequest req) {
    return build(409, "Conflict", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ErrorResponse> unauthorized(UnauthorizedException ex, HttpServletRequest req) {
    return build(401, "Unauthorized", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<ErrorResponse> forbidden(ForbiddenException ex, HttpServletRequest req) {
    return build(403, "Forbidden", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ErrorResponse> bad(BadRequestException ex, HttpServletRequest req) {
    return build(400, "Bad Request", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(RateLimitException.class)
  public ResponseEntity<ErrorResponse> rate(RateLimitException ex, HttpServletRequest req) {
    return build(429, "Too Many Requests", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> generic(Exception ex, HttpServletRequest req) {
    return build(500, "Internal Server Error", ex.getMessage(), req.getRequestURI());
  }

  private ResponseEntity<ErrorResponse> build(int status, String error, String message, String path) {
    return ResponseEntity.status(status)
        .body(new ErrorResponse(Instant.now().toString(), status, error, message, path, null));
  }
}
