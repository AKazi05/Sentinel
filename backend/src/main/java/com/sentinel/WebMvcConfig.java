package com.sentinel;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    // Allow REST API calls
    registry.addMapping("/api/**")
            .allowedOrigins("http://18.219.9.22:3000", "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowCredentials(true);

    // Also allow CORS for websocket fallback paths (SockJS uses /ws/** like /ws/info)
    registry.addMapping("/ws/**")
            .allowedOrigins("http://18.219.9.22:3000", "http://localhost:3000")
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowCredentials(true);
  }
}
