package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
  long countByRole(Role role);
}
