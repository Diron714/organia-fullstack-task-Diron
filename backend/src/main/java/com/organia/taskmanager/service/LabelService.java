package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.LabelRequest;
import com.organia.taskmanager.dto.response.LabelResponse;
import com.organia.taskmanager.entity.Label;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.exception.BadRequestException;
import com.organia.taskmanager.exception.ForbiddenException;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.repository.LabelRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LabelService {
  private final LabelRepository labelRepository;

  public LabelService(LabelRepository labelRepository) {
    this.labelRepository = labelRepository;
  }

  @Transactional(readOnly = true)
  public List<LabelResponse> list(User user) {
    return labelRepository.findByUser_IdOrderByNameAsc(user.getId()).stream()
        .map(l -> new LabelResponse(l.getId(), l.getName(), l.getColor()))
        .toList();
  }

  @Transactional
  public LabelResponse create(User user, LabelRequest req) {
    labelRepository
        .findByNameAndUser_Id(req.name().trim(), user.getId())
        .ifPresent(
            x -> {
              throw new BadRequestException("You already have a label with this name");
            });

    Label label =
        Label.builder()
            .name(req.name().trim())
            .color(req.color())
            .user(user)
            .createdAt(Instant.now())
            .build();
    label = labelRepository.save(label);
    return new LabelResponse(label.getId(), label.getName(), label.getColor());
  }

  @Transactional
  public void delete(User user, Long id) {
    Label label = labelRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Label not found"));
    if (!label.getUser().getId().equals(user.getId())) {
      throw new ForbiddenException("You cannot delete this label");
    }
    labelRepository.delete(label);
  }
}
