package com.organia.taskmanager.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.organia.taskmanager.dto.DashboardPreferences;
import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.TaskStatus;
import com.organia.taskmanager.exception.*;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.RefreshTokenRepository;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import com.organia.taskmanager.utils.PasswordValidator;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Locale;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final TaskRepository taskRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder encoder;
  private final RefreshTokenRepository refreshTokenRepository;
  private final ObjectMapper objectMapper;

  @Value("${app.upload.max-size-mb:5}")
  private int maxUploadMb;

  @Value("${app.upload.avatar-dir:uploads/avatars}")
  private String avatarDir;

  public UserService(
      UserRepository userRepository,
      TaskRepository taskRepository,
      UserMapper userMapper,
      PasswordEncoder encoder,
      RefreshTokenRepository refreshTokenRepository,
      ObjectMapper objectMapper) {
    this.userRepository = userRepository;
    this.taskRepository = taskRepository;
    this.userMapper = userMapper;
    this.encoder = encoder;
    this.refreshTokenRepository = refreshTokenRepository;
    this.objectMapper = objectMapper;
  }

  public MeProfileResponse meProfile(User user) {
    Long uid = user.getId();
    Specification<Task> involving =
        (root, query, cb) ->
            cb.or(
                cb.equal(root.get("owner").get("id"), uid),
                cb.equal(root.get("assignedTo").get("id"), uid));
    long total = taskRepository.count(involving);
    long completed =
        taskRepository.count(
            Specification.where(involving).and((r, q, cb) -> cb.equal(r.get("status"), TaskStatus.COMPLETED)));
    long overdue =
        taskRepository.count(
            Specification.where(involving)
                .and(
                    (r, q, cb) ->
                        cb.and(
                            r.get("dueDate").isNotNull(),
                            cb.lessThan(r.get("dueDate"), LocalDate.now()),
                            cb.notEqual(r.get("status"), TaskStatus.COMPLETED))));
    TaskStatsDto stats = new TaskStatsDto(total, completed, overdue);
    return new MeProfileResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getRole().name(),
        user.getAvatarUrl(),
        user.isVerified(),
        user.getCreatedAt(),
        stats);
  }

  public UserResponse update(User user, UpdateProfileRequest req) {
    if (req.name() != null) {
      user.setName(req.name());
    }
    if (req.avatarUrl() != null) {
      String u = req.avatarUrl().trim();
      if (u.isEmpty()) {
        user.setAvatarUrl(null);
      } else {
        if (u.startsWith("data:")) {
          throw new BadRequestException(
              "Use Upload photo for images. The URL field accepts links only, not embedded image data.");
        }
        if (u.length() > 2048) {
          throw new BadRequestException("Avatar URL is too long (maximum 2048 characters).");
        }
        user.setAvatarUrl(u);
      }
    }
    return userMapper.toResponse(userRepository.save(user));
  }

  public MessageResponse changePassword(User user, ChangePasswordRequest req) {
    if (!encoder.matches(req.currentPassword(), user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
    if (!req.newPassword().equals(req.confirmPassword())) {
      throw new BadRequestException("Passwords do not match");
    }
    PasswordValidator.validate(req.newPassword());
    user.setPassword(encoder.encode(req.newPassword()));
    userRepository.save(user);
    refreshTokenRepository.deleteByUser(user);
    return new MessageResponse("Password changed");
  }

  public DashboardPreferences getDashboardPreferences(User user) {
    String json = user.getDashboardPreferences();
    if (json == null || json.isBlank()) {
      return defaultPreferences();
    }
    try {
      JsonNode root = objectMapper.readTree(json);
      DashboardPreferences p = objectMapper.treeToValue(root, DashboardPreferences.class);
      if (!root.has("showStreakCard")) {
        p.setShowStreakCard(true);
      }
      return p;
    } catch (Exception e) {
      return defaultPreferences();
    }
  }

  @Transactional
  public DashboardPreferences saveDashboardPreferences(User user, DashboardPreferences prefs) {
    try {
      user.setDashboardPreferences(objectMapper.writeValueAsString(prefs));
      userRepository.save(user);
      return prefs;
    } catch (JsonProcessingException e) {
      throw new BadRequestException("Could not save preferences");
    }
  }

  private static DashboardPreferences defaultPreferences() {
    return new DashboardPreferences();
  }

  @Transactional
  public String uploadAvatar(User user, MultipartFile file) throws IOException {
    long maxBytes = (long) maxUploadMb * 1024 * 1024;
    if (file.getSize() > maxBytes) {
      throw new BadRequestException("File must be " + maxUploadMb + "MB or smaller");
    }
    String ct = file.getContentType();
    if (ct == null || ct.isBlank()) {
      throw new BadRequestException("Could not detect image type; try JPEG or PNG");
    }
    ct = ct.toLowerCase(Locale.ROOT).trim();
    if ("image/jpg".equals(ct)) {
      ct = "image/jpeg";
    }
    if (!(ct.equals("image/jpeg")
        || ct.equals("image/png")
        || ct.equals("image/webp")
        || ct.equals("image/gif"))) {
      throw new BadRequestException("Only JPEG, PNG, WebP, or GIF images are allowed");
    }

    // Scale + encode to JPEG, then store as a Base64 data URL in the DB.
    // This avoids relying on Railway's ephemeral filesystem (which is wiped on every redeploy).
    byte[] raw = file.getBytes();
    byte[] jpeg = tryEncodeScaledJpeg(raw);

    String dataUrl;
    if (jpeg != null) {
      dataUrl = "data:image/jpeg;base64," + java.util.Base64.getEncoder().encodeToString(jpeg);
    } else {
      // Fallback: store original bytes with detected mime type
      dataUrl = "data:" + ct + ";base64," + java.util.Base64.getEncoder().encodeToString(raw);
    }

    user.setAvatarUrl(dataUrl);
    userRepository.save(user);
    return dataUrl;
  }

  private static void deleteExistingAvatarFiles(Path dir, long userId) throws IOException {
    try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, userId + ".*")) {
      for (Path p : stream) {
        Files.deleteIfExists(p);
      }
    }
  }

  /** Max dimension for stored avatars (keeps files small; DB stores only a short URL). */
  private static byte[] tryEncodeScaledJpeg(byte[] input) throws IOException {
    BufferedImage src = ImageIO.read(new ByteArrayInputStream(input));
    if (src == null) {
      return null;
    }
    int maxDim = 512;
    int w = src.getWidth();
    int h = src.getHeight();
    double scale = Math.min(1.0, (double) maxDim / Math.max(w, h));
    int nw = Math.max(1, (int) Math.round(w * scale));
    int nh = Math.max(1, (int) Math.round(h * scale));
    BufferedImage dst = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = dst.createGraphics();
    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    g.drawImage(src, 0, 0, nw, nh, null);
    g.dispose();
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    ImageIO.write(dst, "jpg", out);
    return out.toByteArray();
  }

  private static String extensionForMime(String ct) {
    return switch (ct) {
      case "image/png" -> "png";
      case "image/webp" -> "webp";
      case "image/gif" -> "gif";
      default -> "jpg";
    };
  }

  public MessageResponse delete(User user, DeleteAccountRequest req) {
    String confirm =
        req.confirmEmail() == null ? "" : req.confirmEmail().trim().toLowerCase(Locale.ROOT);
    if (!confirm.equals(user.getEmail())) {
      throw new BadRequestException("Type your account email exactly to confirm deletion");
    }
    refreshTokenRepository.deleteByUser(user);
    userRepository.delete(user);
    return new MessageResponse("Account deleted");
  }
}
