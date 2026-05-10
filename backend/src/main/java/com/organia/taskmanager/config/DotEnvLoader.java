package com.organia.taskmanager.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Loads {@code .env} into JVM system properties before Spring starts, so
 * {@code application.properties} can resolve {@code ${MAIL_USERNAME}}, etc.
 * <p>Searches: {@code .env} and {@code backend/.env} starting at the working directory, then each
 * parent directory (handles IDE runs from {@code backend/target} or repo root).
 */
public final class DotEnvLoader {
  private DotEnvLoader() {}

  public static void loadIfPresent() {
    Path start = Path.of("").toAbsolutePath().normalize();
    Path current = start;
    for (int depth = 0; depth < 12; depth++) {
      if (tryLoad(current.resolve(".env"))) {
        return;
      }
      if (tryLoad(current.resolve("backend").resolve(".env"))) {
        return;
      }
      Path parent = current.getParent();
      if (parent == null || parent.equals(current)) {
        break;
      }
      current = parent;
    }
    System.err.println(
        "[organia-task-manager] No .env file found (checked .env and backend/.env from "
            + start
            + " upward). Set MAIL_USERNAME / MAIL_PASSWORD in the environment or add backend/.env.");
  }

  private static boolean tryLoad(Path envFile) {
    if (!Files.isRegularFile(envFile)) {
      return false;
    }
    try {
      parseAndSet(envFile);
      System.err.println("[organia-task-manager] Loaded environment from " + envFile.toAbsolutePath());
      return true;
    } catch (IOException e) {
      System.err.println("[organia-task-manager] Failed to read " + envFile + ": " + e.getMessage());
      return false;
    }
  }

  private static void parseAndSet(Path envFile) throws IOException {
    List<String> lines = Files.readAllLines(envFile, StandardCharsets.UTF_8);
    for (int i = 0; i < lines.size(); i++) {
      String line = lines.get(i);
      if (i == 0 && !line.isEmpty() && line.charAt(0) == '\uFEFF') {
        line = line.substring(1);
      }
      processLine(line);
    }
  }

  private static void processLine(String raw) {
    String line = raw.trim();
    if (line.isEmpty() || line.startsWith("#")) {
      return;
    }
    int eq = line.indexOf('=');
    if (eq < 1) {
      return;
    }
    String key = line.substring(0, eq).trim();
    String val = line.substring(eq + 1).trim();
    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length() - 1);
    }
    if (System.getenv(key) != null) {
      return;
    }
    if (System.getProperty(key) == null) {
      System.setProperty(key, val);
    }
  }
}
