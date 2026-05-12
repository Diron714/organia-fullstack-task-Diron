package com.organia.taskmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organia.taskmanager.dto.response.ErrorResponse;
import com.organia.taskmanager.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;
  private final UserDetailsService userDetailsService;
  private final ObjectMapper objectMapper;

  public JwtAuthFilter(
      JwtService jwtService, UserDetailsService userDetailsService, ObjectMapper objectMapper) {
    this.jwtService = jwtService;
    this.userDetailsService = userDetailsService;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String auth = request.getHeader("Authorization");
    if (auth != null && auth.startsWith("Bearer ")) {
      String token = auth.substring(7).trim();
      if (token.isEmpty() || !jwtService.isValid(token)) {
        if (requiresValidJwt(request.getRequestURI())) {
          writeUnauthorized(response, request.getRequestURI(), "Invalid or expired token");
          return;
        }
      } else {
        var userDetails = userDetailsService.loadUserByUsername(jwtService.extractSubject(token));
        var authToken =
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);
      }
    }
    filterChain.doFilter(request, response);
  }

  /** Paths that must not reject the request when the Bearer token is missing or invalid (public API). */
  private static boolean requiresValidJwt(String uri) {
    if (uri == null) {
      return true;
    }
    return !uri.equals("/")
        && !uri.startsWith("/api/auth/")
        && !uri.startsWith("/actuator/")
        && !uri.startsWith("/uploads/")
        && !uri.startsWith("/swagger-ui")
        && !uri.startsWith("/v3/api-docs")
        && !uri.startsWith("/ws");
  }

  private void writeUnauthorized(HttpServletResponse response, String path, String message) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    var body =
        new ErrorResponse(Instant.now().toString(), 401, "Unauthorized", message, path, null);
    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
