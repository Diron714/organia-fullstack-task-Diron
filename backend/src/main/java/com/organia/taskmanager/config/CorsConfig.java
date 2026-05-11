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

  @Value("${app.cors.allowed-origins:http://localhost:5173}")
  private String allowedOrigins;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    String[] origins =
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    if (origins.length == 0) {
      origins = new String[] {"http://localhost:5173"};
    }
    registry
        .addMapping("/api/**")
        .allowedOrigins(origins)
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
    String[] origins =
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);
    if (origins.length == 0) {
      origins = new String[] {"http://localhost:5173"};
    }

    CorsConfiguration api = new CorsConfiguration();
    api.setAllowCredentials(true);
    api.setAllowedOrigins(List.of(origins));
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
