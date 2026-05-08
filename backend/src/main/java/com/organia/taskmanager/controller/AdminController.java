package com.organia.taskmanager.controller;

import com.organia.taskmanager.dto.request.*;
import com.organia.taskmanager.dto.response.*;
import com.organia.taskmanager.service.AdminService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {
  private final AdminService adminService;
  public AdminController(AdminService adminService){ this.adminService=adminService; }
  @GetMapping("/users") public PagedResponse<UserResponse> users(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){ return adminService.users(page,size); }
  @GetMapping("/users/list") public java.util.List<UserResponse> usersList(){ return adminService.usersList(); }
  @PutMapping("/users/{id}/role") public MessageResponse role(@PathVariable Long id,@Valid @RequestBody ChangeUserRoleRequest req){ return adminService.changeRole(id,req); }
  @DeleteMapping("/users/{id}") public MessageResponse deleteUser(@PathVariable Long id){ return adminService.deleteUser(id); }
  @GetMapping("/tasks") public PagedResponse<TaskResponse> tasks(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size){ return adminService.tasks(page,size); }
  @PatchMapping("/tasks/{id}/assign") public TaskResponse assign(@PathVariable Long id,@Valid @RequestBody AssignTaskRequest req){ return adminService.assign(id,req); }
  @PostMapping("/tasks/bulk-action") public MessageResponse bulk(@Valid @RequestBody BulkTaskActionRequest req){ return adminService.bulk(req); }
  @GetMapping("/stats") public Map<String,Object> stats(){ return Map.of("totalUsers",0,"totalTasks",0,"tasksByStatus",Map.of(),"tasksByPriority",Map.of(),"overdueTasks",0,"recentActivity",java.util.List.of()); }
}
