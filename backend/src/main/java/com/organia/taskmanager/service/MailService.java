package com.organia.taskmanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.EmailOtpKind;
import com.organia.taskmanager.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {
  private static final Logger log = LoggerFactory.getLogger(MailService.class);

  private enum EmailTheme {
    BRAND("#4f46e5", "#6366f1"),
    SECURITY("#c2410c", "#ea580c");

    final String gradientStart;
    final String gradientEnd;

    EmailTheme(String gradientStart, String gradientEnd) {
      this.gradientStart = gradientStart;
      this.gradientEnd = gradientEnd;
    }
  }

  private final JavaMailSender smtpSender;
  private final String fromAddress;
  private final String mailPassword;
  private final int otpExpiryMinutes;
  private final String frontendUrl;
  private final String resendApiKey;

  private final HttpClient httpClient = HttpClient.newHttpClient();
  private final ObjectMapper objectMapper = new ObjectMapper();

  public MailService(
      JavaMailSender smtpSender,
      @Value("${spring.mail.username}") String fromAddress,
      @Value("${spring.mail.password}") String mailPassword,
      @Value("${app.otp.expiry-minutes:10}") int otpExpiryMinutes,
      @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl,
      @Value("${RESEND_API_KEY:}") String resendApiKey) {
    this.smtpSender = smtpSender;
    this.fromAddress = fromAddress;
    this.mailPassword = mailPassword;
    this.otpExpiryMinutes = otpExpiryMinutes;
    this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    this.resendApiKey = resendApiKey == null ? "" : resendApiKey.trim();
  }

  /** True when Resend API key is configured — preferred over SMTP on hosted platforms. */
  private boolean useResend() {
    return !resendApiKey.isBlank();
  }

  @PostConstruct
  void validateMailConfig() {
    if (useResend()) {
      log.info("Mail: using Resend HTTP API (RESEND_API_KEY is set).");
    } else if (isPlaceholderMailConfig()) {
      log.warn(
          "Mail is not configured. Set RESEND_API_KEY (recommended for Railway) "
              + "or set MAIL_USERNAME + MAIL_PASSWORD for SMTP. OTP emails will fail until then.");
    } else {
      log.info("Mail: using SMTP ({})", fromAddress);
    }
  }

  private boolean isPlaceholderMailConfig() {
    if (fromAddress == null || fromAddress.isBlank()) return true;
    String u = fromAddress.trim();
    if ("youremail@gmail.com".equalsIgnoreCase(u) || "your@gmail.com".equalsIgnoreCase(u)) return true;
    if (mailPassword == null || mailPassword.isBlank()) return true;
    return "your-app-password".equals(mailPassword);
  }

  private void assertMailReady() {
    if (useResend()) return; // Resend is always ready when key is set
    if (fromAddress == null || fromAddress.isBlank()) {
      throw new BadRequestException(
          "Email is not configured: set RESEND_API_KEY on Railway, or set MAIL_USERNAME for SMTP.");
    }
    if (isPlaceholderMailConfig()) {
      throw new BadRequestException(
          "Email is not configured: set RESEND_API_KEY (recommended) or "
              + "MAIL_USERNAME + MAIL_PASSWORD (Gmail App Password, 16 chars, no spaces).");
    }
  }

  public void sendOtp(String to, String subject, String otp, EmailOtpKind kind) {
    assertMailReady();
    EmailTheme theme = kind == EmailOtpKind.PASSWORD_RESET ? EmailTheme.SECURITY : EmailTheme.BRAND;
    String headline = kind == EmailOtpKind.PASSWORD_RESET ? "Reset your password" : "Verify your email";
    String actionPhrase = kind == EmailOtpKind.PASSWORD_RESET
        ? "confirm this password reset"
        : "complete your Organia registration";
    String html = organiaEmailHtml(theme, headline, otpInnerHtml(otp, actionPhrase));
    try {
      sendHtml(to, subject, html);
      log.info("OTP email ({}) dispatched for {}", kind, to);
    } catch (Exception e) {
      log.error("OTP email failed for {}: {}", to, e.getMessage());
      throw new BadRequestException("Failed to send verification email. Check mail configuration.");
    }
  }

  /** Sends in the background so registration/forgot-password HTTP responses are not blocked. */
  @Async
  public void sendOtpAsync(String to, String subject, String otp, EmailOtpKind kind) {
    try {
      sendOtp(to, subject, otp, kind);
    } catch (Exception ex) {
      log.error("Async OTP email ({}) to {} failed (user can retry resend where available)", kind, to, ex);
    }
  }

  @Async
  public void sendWelcomeEmailAsync(User user) {
    try {
      sendWelcomeEmail(user);
    } catch (Exception ex) {
      log.error("Welcome email failed for {}", user != null ? user.getEmail() : "?", ex);
    }
  }

  public void sendWelcomeEmail(User user) {
    try {
      if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return;
      if (!useResend() && isPlaceholderMailConfig()) {
        log.warn("Skipping welcome email (mail not configured)");
        return;
      }
      String firstName = user.getName() != null ? user.getName().split("\\s+")[0] : "";
      String dashLink = frontendUrl + "/dashboard";
      String inner =
          "<p style=\"margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;\">Hi "
              + escapeHtml(firstName)
              + ", thanks for verifying your email. Your Organia account is ready.</p>"
              + "<p style=\"margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;\">"
              + "Open the dashboard to create tasks, track deadlines, and stay on top of your week.</p>"
              + "<p style=\"margin:0;\"><a href=\""
              + dashLink
              + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;"
              + "border-radius:8px;text-decoration:none;font-weight:600;\">Go to dashboard</a></p>";
      String html = organiaEmailHtml(EmailTheme.BRAND, "Welcome to Organia", inner);
      sendHtml(user.getEmail(), "Welcome to Organia", html);
      log.info("Welcome email sent to {}", user.getEmail());
    } catch (Exception e) {
      log.error("Welcome email failed for {}: {}", user != null ? user.getEmail() : "?", e.getMessage());
    }
  }

  public void sendDueReminderEmail(User user, Task task) {
    try {
      if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return;
      if (!useResend() && isPlaceholderMailConfig()) {
        log.warn("Skipping due reminder email (mail not configured)");
        return;
      }
      String due = task.getDueDate() == null
          ? "—"
          : task.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH));
      String link = frontendUrl + "/tasks/" + task.getId() + "/edit";
      String firstName = user.getName() != null ? user.getName().split("\\s+")[0] : "";
      String inner =
          "<p style=\"margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;\">Hi "
              + escapeHtml(firstName) + ", one of your tasks is <strong>due tomorrow</strong>.</p>"
              + "<div style=\"background:#f9fafb;padding:16px;border-radius:8px;margin:0 0 20px;border:1px solid #e5e7eb;\">"
              + "<p style=\"margin:4px 0;font-size:14px;color:#111827;\"><strong>Title:</strong> " + escapeHtml(task.getTitle()) + "</p>"
              + "<p style=\"margin:4px 0;font-size:14px;color:#111827;\"><strong>Priority:</strong> " + escapeHtml(String.valueOf(task.getPriority())) + "</p>"
              + "<p style=\"margin:4px 0;font-size:14px;color:#111827;\"><strong>Due date:</strong> " + escapeHtml(due) + "</p>"
              + "<p style=\"margin:4px 0;font-size:14px;color:#111827;\"><strong>Status:</strong> " + escapeHtml(String.valueOf(task.getStatus())) + "</p>"
              + "</div>"
              + "<p style=\"margin:0;\"><a href=\"" + link
              + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;"
              + "border-radius:8px;text-decoration:none;font-weight:600;\">View task</a></p>";
      String html = organiaEmailHtml(EmailTheme.BRAND, "Task due tomorrow", inner);
      sendHtml(user.getEmail(), "Task due tomorrow: " + task.getTitle(), html);
      log.info("Due reminder email sent to {}", user.getEmail());
    } catch (Exception e) {
      log.error("Due reminder email failed for {}: {}", user != null ? user.getEmail() : "?", e.getMessage());
    }
  }

  public void sendWeeklySummaryEmail(
      User user, int completed, int overdue, List<Task> dueSoon, LocalDate weekStart, LocalDate weekEnd) {
    try {
      if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return;
      if (!useResend() && isPlaceholderMailConfig()) {
        log.warn("Skipping weekly summary email (mail not configured)");
        return;
      }
      String weekLabelStart = weekStart.format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH));
      String weekLabelEnd = weekEnd.format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH));
      String firstName = user.getName() != null ? user.getName().split("\\s+")[0] : "";
      String dashLink = frontendUrl + "/dashboard";
      StringBuilder list = new StringBuilder();
      if (dueSoon != null && !dueSoon.isEmpty()) {
        list.append("<p style=\"margin:20px 0 8px;font-weight:600;color:#111827;\">Upcoming due dates:</p><ul style=\"margin:0;padding-left:20px;color:#374151;\">");
        for (Task t : dueSoon) {
          String d = t.getDueDate() == null ? "—" : t.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH));
          list.append("<li style=\"margin:6px 0;\">").append(escapeHtml(t.getTitle())).append(" — ").append(escapeHtml(d)).append("</li>");
        }
        list.append("</ul>");
      }
      String inner =
          "<p style=\"margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;\">Hi "
              + escapeHtml(firstName) + ", here is your snapshot for the week of <strong>"
              + escapeHtml(weekLabelStart) + "</strong> – <strong>" + escapeHtml(weekLabelEnd) + "</strong>.</p>"
              + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"8\" style=\"width:100%;margin:16px 0;\"><tr>"
              + "<td style=\"background:#dcfce7;padding:14px;border-radius:8px;text-align:center;\"><strong style=\"font-size:20px;color:#166534;\">" + completed + "</strong><br/><span style=\"font-size:12px;color:#15803d;\">completed</span></td>"
              + "<td style=\"background:#fee2e2;padding:14px;border-radius:8px;text-align:center;\"><strong style=\"font-size:20px;color:#991b1b;\">" + overdue + "</strong><br/><span style=\"font-size:12px;color:#b91c1c;\">overdue now</span></td>"
              + "<td style=\"background:#dbeafe;padding:14px;border-radius:8px;text-align:center;\"><strong style=\"font-size:20px;color:#1e40af;\">" + (dueSoon == null ? 0 : dueSoon.size()) + "</strong><br/><span style=\"font-size:12px;color:#1d4ed8;\">due this week</span></td>"
              + "</tr></table>" + list
              + "<p style=\"margin:24px 0 0;\"><a href=\"" + dashLink
              + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;"
              + "border-radius:8px;text-decoration:none;font-weight:600;\">Open dashboard</a></p>";
      String html = organiaEmailHtml(EmailTheme.BRAND, "Your weekly summary", inner);
      sendHtml(user.getEmail(), "Your weekly summary — week of " + weekLabelStart, html);
      log.info("Weekly summary email sent to {}", user.getEmail());
    } catch (Exception e) {
      log.error("Weekly summary email failed for {}: {}", user != null ? user.getEmail() : "?", e.getMessage());
    }
  }

  // ── Transport ──────────────────────────────────────────────────────────────

  /**
   * Sends an HTML email. Uses Resend HTTP API when RESEND_API_KEY is set,
   * otherwise falls back to JavaMailSender (SMTP — works on localhost, blocked on Railway).
   */
  private void sendHtml(String to, String subject, String html) throws Exception {
    if (useResend()) {
      sendViaResend(to, subject, html);
    } else {
      sendViaSmtp(to, subject, html);
    }
  }

  /** Resend HTTP API — works on any host including Railway (uses port 443). */
  private void sendViaResend(String to, String subject, String html) throws Exception {
    // "from" must be a verified sender on Resend. Use your domain or the shared onboarding address.
    String fromResend = "Organia <onboarding@resend.dev>";

    Map<String, Object> body = Map.of(
        "from", fromResend,
        "to", List.of(to),
        "subject", subject,
        "html", html
    );

    String jsonBody = objectMapper.writeValueAsString(body);

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.resend.com/emails"))
        .header("Authorization", "Bearer " + resendApiKey)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
        .build();

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new RuntimeException("Resend API error " + response.statusCode() + ": " + response.body());
    }
    log.debug("Resend API response {}: {}", response.statusCode(), response.body());
  }

  /** SMTP fallback — use for local development only. Railway blocks SMTP ports. */
  private void sendViaSmtp(String to, String subject, String html) throws MessagingException {
    MimeMessage mime = smtpSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
    helper.setFrom(fromAddress.trim());
    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(html, true);
    smtpSender.send(mime);
  }

  // ── HTML builders ──────────────────────────────────────────────────────────

  private String organiaEmailHtml(EmailTheme theme, String headline, String innerHtml) {
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/>"
        + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/></head>"
        + "<body style=\"margin:0;padding:0;background:#f3f4f6;\">"
        + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
        + "style=\"background:#f3f4f6;padding:28px 16px;\">"
        + "<tr><td align=\"center\">"
        + "<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" "
        + "style=\"max-width:560px;width:100%;background:#ffffff;border-radius:12px;"
        + "overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);\">"
        + "<tr><td style=\"background:linear-gradient(135deg,"
        + theme.gradientStart + " 0%," + theme.gradientEnd + " 100%);padding:26px 28px;\">"
        + "<p style=\"margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;\">Organia</p>"
        + "<p style=\"margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.9);\">Task Manager</p>"
        + "</td></tr>"
        + "<tr><td style=\"padding:28px 28px 8px;\">"
        + "<h1 style=\"margin:0 0 18px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;\">"
        + escapeHtml(headline) + "</h1>"
        + innerHtml
        + "</td></tr>"
        + "<tr><td style=\"padding:8px 28px 26px;border-top:1px solid #e5e7eb;\">"
        + "<p style=\"margin:0;font-size:12px;color:#6b7280;line-height:1.55;\">"
        + "You are receiving this because of activity on your Organia account. "
        + "If this was not you, you can ignore this message.</p>"
        + "</td></tr></table></td></tr></table></body></html>";
  }

  private String otpInnerHtml(String otp, String actionPhrase) {
    return "<p style=\"margin:0 0 18px;font-size:15px;color:#374151;line-height:1.6;\">Use this code to "
        + escapeHtml(actionPhrase) + ":</p>"
        + "<div style=\"text-align:center;margin:22px 0;\">"
        + "<span style=\"display:inline-block;font-family:'Consolas','Courier New',monospace;font-size:26px;"
        + "font-weight:700;letter-spacing:10px;color:#111827;background:#f3f4f6;padding:18px 24px;"
        + "border-radius:10px;border:1px solid #e5e7eb;\">"
        + escapeHtml(otp) + "</span></div>"
        + "<p style=\"margin:0;font-size:13px;color:#6b7280;line-height:1.55;\">This code expires in "
        + "<strong>" + otpExpiryMinutes + "</strong> minutes. "
        + "If you did not request this email, you can safely ignore it.</p>";
  }

  private static String escapeHtml(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
  }
}
