package com.organia.taskmanager.service;

import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final com.organia.taskmanager.security.JwtService delegate;
  public JwtService(com.organia.taskmanager.security.JwtService delegate){ this.delegate = delegate; }
  public String generateAccessToken(String subject){ return delegate.generateAccessToken(subject); }
  public String generateRefreshToken(String subject){ return delegate.generateRefreshToken(subject); }
  public String extractSubject(String token){ return delegate.extractSubject(token); }
  public boolean isValid(String token){ return delegate.isValid(token); }
}
