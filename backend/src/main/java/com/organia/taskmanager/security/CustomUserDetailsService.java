package com.organia.taskmanager.security;

import com.organia.taskmanager.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
  private final UserRepository userRepository;
  public CustomUserDetailsService(UserRepository userRepository) { this.userRepository = userRepository; }
  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    var user = userRepository.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("User not found"));
    return User.withUsername(user.getEmail()).password(user.getPassword()).roles(user.getRole().name()).build();
  }
}
