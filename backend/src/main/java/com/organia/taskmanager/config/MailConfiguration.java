package com.organia.taskmanager.config;

import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Explicit SMTP setup so Gmail settings are always applied (avoids relying only on auto-config
 * ordering with {@code .env}-loaded system properties).
 */
@Configuration
@Profile("!test")
public class MailConfiguration {

  @Bean
  public JavaMailSender javaMailSender(
      @Value("${spring.mail.host}") String host,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.username}") String username,
      @Value("${spring.mail.password}") String password,
      @Value("${spring.mail.default-encoding:UTF-8}") String encoding) {
    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(host);
    sender.setPort(port);
    sender.setUsername(username);
    sender.setPassword(password);
    sender.setDefaultEncoding(encoding);

    Properties props = sender.getJavaMailProperties();
    props.put("mail.transport.protocol", "smtp");
    props.put("mail.smtp.auth", "true");
    props.put("mail.smtp.starttls.enable", "true");
    props.put("mail.smtp.starttls.required", "true");
    props.put("mail.smtp.ssl.trust", host);
    props.put("mail.smtp.connectiontimeout", "10000");
    props.put("mail.smtp.timeout", "10000");
    props.put("mail.smtp.writetimeout", "10000");

    return sender;
  }
}
