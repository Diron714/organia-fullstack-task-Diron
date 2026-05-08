package com.organia.taskmanager.service;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.entity.Task;
import com.organia.taskmanager.entity.User;
import com.organia.taskmanager.enums.NotificationType;
import com.organia.taskmanager.exception.ResourceNotFoundException;
import com.organia.taskmanager.mapper.TaskMapper;
import com.organia.taskmanager.mapper.UserMapper;
import com.organia.taskmanager.repository.TaskRepository;
import com.organia.taskmanager.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
  private final UserRepository userRepository; private final TaskRepository taskRepository; private final UserMapper userMapper; private final TaskMapper taskMapper; private final NotificationService notificationService;
  public AdminService(UserRepository userRepository, TaskRepository taskRepository, UserMapper userMapper, TaskMapper taskMapper, NotificationService notificationService){ this.userRepository=userRepository; this.taskRepository=taskRepository; this.userMapper=userMapper; this.taskMapper=taskMapper; this.notificationService=notificationService; }
  public PagedResponse<UserResponse> users(int page,int size){ var p=userRepository.findAll(PageRequest.of(page,size)); return new PagedResponse<>(p.getContent().stream().map(userMapper::toResponse).toList(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()); }
  public java.util.List<UserResponse> usersList(){ return userRepository.findAll().stream().map(userMapper::toResponse).toList(); }
  public MessageResponse changeRole(Long id, ChangeUserRoleRequest req){ User user=userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")); user.setRole(req.role()); userRepository.save(user); return new MessageResponse("Role updated"); }
  public MessageResponse deleteUser(Long id){ userRepository.deleteById(id); return new MessageResponse("User deleted"); }
  public PagedResponse<TaskResponse> tasks(int page,int size){ var p=taskRepository.findAll(PageRequest.of(page,size)); return new PagedResponse<>(p.getContent().stream().map(t -> taskMapper.toResponse(t,false,0)).toList(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()); }
  public TaskResponse assign(Long id, AssignTaskRequest req){ Task task=taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found")); User assigned=req.assignedToId()==null?null:userRepository.findById(req.assignedToId()).orElseThrow(() -> new ResourceNotFoundException("User not found")); task.setAssignedTo(assigned); task=taskRepository.save(task); if(assigned!=null) notificationService.create(assigned,"Task assigned","A task was assigned to you",NotificationType.TASK_ASSIGNED,task.getId()); return taskMapper.toResponse(task,false,0); }
  public MessageResponse bulk(BulkTaskActionRequest req){ if("DELETE".equalsIgnoreCase(req.action())) taskRepository.deleteAllById(req.taskIds()); return new MessageResponse("Bulk action applied"); }
}
