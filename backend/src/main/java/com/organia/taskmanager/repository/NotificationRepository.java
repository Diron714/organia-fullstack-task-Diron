package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.Notification;
import com.organia.taskmanager.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  Page<Notification> findByUserOrderByIsReadAscCreatedAtDesc(User user, Pageable pageable);
  long countByUserAndIsReadFalse(User user);

  @Modifying
  @Query("update Notification n set n.isRead = true where n.user.id = :userId and n.isRead = false")
  int markAllReadForUser(@Param("userId") Long userId);
}
