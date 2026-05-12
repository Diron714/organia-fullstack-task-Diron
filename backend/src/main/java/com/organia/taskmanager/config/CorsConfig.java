package com.organia.taskmanager.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

  // Default includes local dev + production Vercel URL.
  // Override in Railway by setting: FRONTEND_URL=https://organia-fullstack-task-diron.vercel.app
  @Value("${app.cors.allowed-origins:http://localhost:5173,https://organia-fullstack-task-diron.vercel.app}")
  private String allowedOrigins;

  /** Parse comma-separated allowed-origins into a trimmed, non-empty array. */
  private String[] parsedOrigins() {
    String[] origins =
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    return origins.length == 0
        ? new String[] {"http://localhost:5173", "https://organia-fullstack-task-diron.vercel.app"}
        : origins;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(parsedOrigins())
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
    registry
        .addMapping("/ws/**")
        .allowedOriginPatterns("*")
        .allowedMethods("*")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  /** Used by Spring Security filter chain (preflight + credentialed API calls). */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration api = new CorsConfiguration();
    api.setAllowCredentials(true);
    api.setAllowedOrigins(List.of(parsedOrigins()));
    api.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    api.setAllowedHeaders(List.of("*"));
    api.setExposedHeaders(List.of("Set-Cookie", "Content-Disposition"));
    api.setMaxAge(3600L);

    CorsConfiguration ws = new CorsConfiguration();
    ws.setAllowCredentials(true);
    ws.setAllowedOriginPatterns(List.of("*"));
    ws.setAllowedMethods(List.of("*"));
    ws.setAllowedHeaders(List.of("*"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", api);
    source.registerCorsConfiguration("/ws/**", ws);
    return source;
  }
}
