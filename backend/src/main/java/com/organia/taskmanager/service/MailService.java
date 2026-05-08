package com.organia.taskmanager.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;

@Service
public class MailService {
  private final JavaMailSender sender;
  public MailService(JavaMailSender sender) { this.sender = sender; }
  public void sendOtp(String to, String subject, String otp) {
    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setTo(to); msg.setSubject(subject); msg.setText("Your OTP is: " + otp + " (expires in 10 minutes)");
    sender.send(msg);
  }
}
