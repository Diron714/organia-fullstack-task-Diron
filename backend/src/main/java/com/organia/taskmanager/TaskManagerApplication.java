package com.organia.taskmanager;

import com.organia.taskmanager.config.DotEnvLoader;
import com.organia.taskmanager.config.JwtConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(JwtConfig.class)
@EnableAsync
@EnableScheduling
public class TaskManagerApplication {
  public static void main(String[] args) {
    DotEnvLoader.loadIfPresent();
    SpringApplication.run(TaskManagerApplication.class, args);
  }
}
