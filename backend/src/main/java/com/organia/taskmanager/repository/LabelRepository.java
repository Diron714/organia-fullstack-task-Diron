package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.Label;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LabelRepository extends JpaRepository<Label, Long> {
  List<Label> findByUser_IdOrderByNameAsc(Long userId);

  Optional<Label> findByNameAndUser_Id(String name, Long userId);

  @Query(
      "SELECT l FROM Label l WHERE l.user.id = :uid AND LOWER(l.name) LIKE :q ORDER BY l.name ASC")
  List<Label> searchByUser(@Param("uid") Long uid, @Param("q") String term, Pageable pageable);
}
