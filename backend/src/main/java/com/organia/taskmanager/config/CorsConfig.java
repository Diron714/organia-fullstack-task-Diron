package com.organia.taskmanager.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

  /**
   * Comma-separated origins or patterns. Patterns support {@code https://*.vercel.app} for preview
   * deployments. Example: {@code http://localhost:5173,https://*.vercel.app,https://myapp.vercel.app}
   */
  @Bean
  public CorsFilter corsFilter(
      @Value(
              "${app.cors.allowed-origins:http://localhost:5173,https://*.vercel.app}")
          String allowedOriginsRaw) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    List<String> patterns =
        Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    config.setAllowedOriginPatterns(patterns);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    config.setExposedHeaders(List.of("Set-Cookie", "Content-Disposition"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }
}
