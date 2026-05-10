package com.organia.taskmanager.repository;

import com.organia.taskmanager.entity.TaskComment;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
  List<TaskComment> findByTask_IdOrderByCreatedAtAsc(Long taskId);

  Page<TaskComment> findByTask_Id(Long taskId, Pageable pageable);

  long countByTask_Id(Long taskId);

  @Query(
      "SELECT c FROM TaskComment c JOIN c.task t WHERE (:admin = true OR t.owner.id = :uid OR "
          + "(t.assignedTo IS NOT NULL AND t.assignedTo.id = :uid)) "
          + "AND LOWER(c.content) LIKE :q ORDER BY c.createdAt DESC")
  List<TaskComment> searchVisible(
      @Param("uid") Long uid, @Param("admin") boolean admin, @Param("q") String term, Pageable pageable);
}
