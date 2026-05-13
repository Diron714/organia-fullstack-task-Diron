package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.RefreshToken;
import com.organia.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByToken(String token);

  @Transactional
  void deleteByToken(String token);

  @Transactional
  void deleteByUser(User user);
}
