package com.organia.taskmanager.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${app.upload.avatar-dir:uploads/avatars}")
  private String avatarDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path avatars = Paths.get(avatarDir).toAbsolutePath().normalize();
    Path uploadsRoot = avatars.getParent();
    if (uploadsRoot == null) {
      return;
    }
    String location = uploadsRoot.toUri().toString();
    if (!location.endsWith("/")) {
      location += "/";
    }
    registry.addResourceHandler("/uploads/**").addResourceLocations(location).setCachePeriod(3600);
  }
}
