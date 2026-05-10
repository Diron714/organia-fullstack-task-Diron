package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.response.StreakResponse;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StreakService {
  private final UserRepository userRepository;

  public StreakService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional
  public void updateStreak(User owner) {
    User u = userRepository.findById(owner.getId()).orElseThrow();
    LocalDate today = LocalDate.now();
    LocalDate last = u.getLastCompletionDate();

    if (last == null) {
      u.setCurrentStreak(1);
      u.setLastCompletionDate(today);
      if (u.getCurrentStreak() > u.getLongestStreak()) {
        u.setLongestStreak(u.getCurrentStreak());
      }
      userRepository.save(u);
      return;
    }

    if (last.equals(today)) {
      return;
    }

    if (last.equals(today.minusDays(1))) {
      u.setCurrentStreak(u.getCurrentStreak() + 1);
      u.setLastCompletionDate(today);
      if (u.getCurrentStreak() > u.getLongestStreak()) {
        u.setLongestStreak(u.getCurrentStreak());
      }
      userRepository.save(u);
      return;
    }

    u.setCurrentStreak(1);
    u.setLastCompletionDate(today);
    if (u.getCurrentStreak() > u.getLongestStreak()) {
      u.setLongestStreak(u.getCurrentStreak());
    }
    userRepository.save(u);
  }

  public StreakResponse streakFor(User user) {
    int streak = user.getCurrentStreak();
    int longest = user.getLongestStreak();
    String msg =
        streak <= 0
            ? "Complete a task today to start a streak."
            : streak >= 30
                ? "Outstanding — 30+ days of showing up. That's rare."
                : streak >= 14
                    ? "Two weeks of consistency. Keep stacking wins."
                    : streak >= 7
                        ? "A full week on the board. That's real momentum."
                        : streak >= 3
                            ? "You're building a habit — don't break the chain."
                            : streak >= 2
                                ? "Two days in a row. Come back tomorrow."
                                : "Great start — one more day builds the streak.";
    if (streak > 0 && longest > streak && longest >= 7) {
      msg = msg + " Personal best: " + longest + " days — you can beat it.";
    }
    return new StreakResponse(
        user.getCurrentStreak(), user.getLongestStreak(), user.getLastCompletionDate(), msg);
  }
}
