package com.sentinel;

import com.sentinel.User;
import com.sentinel.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;

    public CustomUserDetailsService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String role = user.getRole();

        // If role is null or empty, assign default role "USER"
        if (role == null || role.trim().isEmpty()) {
            role = "USER";
        } else {
            // Remove "ROLE_" prefix if present
            role = role.replace("ROLE_", "");
        }

        // Return Spring Security User object with role(s)
        return org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                .password(user.getPassword()) // hashed password stored in DB
                .roles(role)
                .build();
    }
}
