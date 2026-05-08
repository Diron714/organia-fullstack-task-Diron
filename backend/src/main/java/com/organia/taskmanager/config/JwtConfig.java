package com.organia.taskmanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtConfig(String secret, long accessTokenExpiryMs, long refreshTokenExpiryMs) {}
