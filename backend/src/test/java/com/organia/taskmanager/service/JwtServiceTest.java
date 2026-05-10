package com.organia.taskmanager.service;

import static org.junit.jupiter.api.Assertions.*;

import com.organia.taskmanager.config.JwtConfig;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
  @Test
  void generate_validate_expiry() {
    JwtService service = new JwtService(new JwtConfig("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@", 1000, 2000));
    String access = service.generateAccessToken("user@example.com");
    assertTrue(service.isValid(access));
    assertEquals("user@example.com", service.extractSubject(access));
  }
}
