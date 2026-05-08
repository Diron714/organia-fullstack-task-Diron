package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.RefreshToken;
import com.organia.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByToken(String token);
  void deleteByToken(String token);
  void deleteByUser(User user);
}
