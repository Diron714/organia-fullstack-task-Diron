package com.organia.taskmanager.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import com.organia.taskmanager.service.MailService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "classpath:cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class TaskControllerIntegrationTest {

  @Autowired MockMvc mockMvc;
  @Autowired JdbcTemplate jdbcTemplate;
  @Autowired ObjectMapper objectMapper;
  @MockBean MailService mailService;

  @Test
  void create_update_activity_delete_flow() throws Exception {
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Task User\",\"email\":\"task@demo.com\",\"password\":\"Password1!\"}"))
        .andExpect(status().isCreated());

    String otp = jdbcTemplate.queryForObject(
        "SELECT otp_code FROM otp_tokens WHERE email=? AND otp_type='EMAIL_VERIFY' ORDER BY id DESC LIMIT 1",
        String.class,
        "task@demo.com");

    mockMvc.perform(post("/api/auth/verify-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"task@demo.com\",\"otpCode\":\"" + otp + "\"}"))
        .andExpect(status().isOk());

    String loginBody = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"task@demo.com\",\"password\":\"Password1!\"}"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    JsonNode loginJson = objectMapper.readTree(loginBody);
    String accessToken = loginJson.path("accessToken").asText();

    mockMvc.perform(post("/api/tasks")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Task A\"}"))
        .andExpect(status().isCreated());

    mockMvc.perform(put("/api/tasks/1")
            .header("Authorization", "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Task A Updated\"}"))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/tasks/1/activity")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isOk());

    mockMvc.perform(delete("/api/tasks/1")
            .header("Authorization", "Bearer " + accessToken))
        .andExpect(status().isNoContent());
  }
}
