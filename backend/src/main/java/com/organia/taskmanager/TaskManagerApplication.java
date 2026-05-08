package com.organia.taskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.organia.taskmanager.config.JwtConfig;

@SpringBootApplication
@EnableConfigurationProperties(JwtConfig.class)
public class TaskManagerApplication {
  public static void main(String[] args) {
    SpringApplication.run(TaskManagerApplication.class, args);
  }
}
