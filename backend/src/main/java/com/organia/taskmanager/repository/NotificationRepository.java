package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.Notification;
import com.organia.taskmanager.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
  Page<Notification> findByUserOrderByIsReadAscCreatedAtDesc(User user, Pageable pageable);
  long countByUserAndIsReadFalse(User user);
}
