package com.organia.taskmanager.exception;

import com.organia.taskmanager.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mail.MailException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    Map<String, String> fields = new HashMap<>();
    for (FieldError e : ex.getBindingResult().getFieldErrors()) {
      fields.put(e.getField(), e.getDefaultMessage());
    }
    return ResponseEntity.badRequest()
        .body(
            new ErrorResponse(
                Instant.now().toString(),
                400,
                "Bad Request",
                "Validation failed",
                req.getRequestURI(),
                fields));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest req) {
    Map<String, String> fields = new HashMap<>();
    for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
      String path = v.getPropertyPath().toString();
      int dot = path.lastIndexOf('.');
      String field = dot >= 0 ? path.substring(dot + 1) : path;
      fields.put(field, v.getMessage());
    }
    return ResponseEntity.badRequest()
        .body(
            new ErrorResponse(
                Instant.now().toString(),
                400,
                "Bad Request",
                "Validation failed",
                req.getRequestURI(),
                fields));
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

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> notReadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
    return build(400, "Bad Request", "Invalid request body", req.getRequestURI());
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ErrorResponse> missingParam(
      MissingServletRequestParameterException ex, HttpServletRequest req) {
    return build(400, "Bad Request", "Missing parameter: " + ex.getParameterName(), req.getRequestURI());
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> typeMismatch(
      MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
    return build(400, "Bad Request", "Invalid parameter type", req.getRequestURI());
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> methodNotSupported(
      HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
    return build(405, "Method Not Allowed", ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> dataIntegrity(
      DataIntegrityViolationException ex, HttpServletRequest req) {
    Throwable root = ex.getMostSpecificCause();
    log.warn("Data constraint violation: {}", root.getMessage());
    String msg = root.getMessage();
    if (msg != null && (msg.contains("Duplicate") || msg.contains("unique") || msg.contains("UK_"))) {
      return build(409, "Conflict", "Email already exists", req.getRequestURI());
    }
    if (msg != null
        && (msg.contains("Data too long")
            || msg.contains("too long for column")
            || msg.contains("truncat")
            || msg.contains("Out of range")
            || msg.contains("OUT OF RANGE"))) {
      return build(
          400,
          "Bad Request",
          "A value was too large to save (for example a profile image pasted as text). "
              + "Use Upload photo on your profile, or use a shorter link.",
          req.getRequestURI());
    }
    return build(409, "Conflict", "Request could not be completed (data conflict).", req.getRequestURI());
  }

  @ExceptionHandler(MailException.class)
  public ResponseEntity<ErrorResponse> mailFailed(MailException ex, HttpServletRequest req) {
    Throwable root = ex.getMostSpecificCause();
    String detail = root != null && root.getMessage() != null ? root.getMessage() : ex.getMessage();
    log.error("SMTP send failed: {}", detail);
    return build(
        503,
        "Service Unavailable",
        "Could not send email. Check MAIL_USERNAME and MAIL_PASSWORD (Gmail app password), and smtp.gmail.com:587. "
            + "If you just registered, your account may already exist — open Verify email and tap Resend code. "
            + "Details: "
            + (detail != null ? detail : "unknown error"),
        req.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> generic(Exception ex, HttpServletRequest req) {
    log.error("Unhandled exception on {}", req.getRequestURI(), ex);
    return build(500, "Internal Server Error", "An unexpected error occurred", req.getRequestURI());
  }

  private ResponseEntity<ErrorResponse> build(int status, String error, String message, String path) {
    return ResponseEntity.status(status)
        .body(new ErrorResponse(Instant.now().toString(), status, error, message, path, null));
  }
}
