package com.organia.taskmanager.security;

import com.organia.taskmanager.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final JwtConfig jwtConfig;

  public JwtService(JwtConfig jwtConfig) {
    this.jwtConfig = jwtConfig;
    this.key = Keys.hmacShaKeyFor(jwtConfig.secret().getBytes(StandardCharsets.UTF_8));
  }

  public String generateAccessToken(String subject) {
    return Jwts.builder()
        .subject(subject)
        .issuedAt(Date.from(Instant.now()))
        .expiration(Date.from(Instant.now().plusMillis(jwtConfig.accessTokenExpiryMs())))
        .signWith(key)
        .compact();
  }

  public String generateRefreshToken(String subject) {
    return Jwts.builder()
        .subject(subject)
        .issuedAt(Date.from(Instant.now()))
        .expiration(Date.from(Instant.now().plusMillis(jwtConfig.refreshTokenExpiryMs())))
        .signWith(key)
        .compact();
  }

  public String extractSubject(String token) {
    return parse(token).getSubject();
  }

  public boolean isValid(String token) {
    try {
      return parse(token).getExpiration().after(new Date());
    } catch (Exception e) {
      return false;
    }
  }

  private Claims parse(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }
}
