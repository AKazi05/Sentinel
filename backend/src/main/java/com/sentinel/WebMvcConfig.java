package com.sentinel;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS configuration for REST API endpoints
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:3000", "http://18.219.9.22:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

        // CORS configuration for WebSocket fallback endpoints (SockJS)
        registry.addMapping("/ws/**")
                .allowedOriginPatterns("http://localhost:3000", "http://18.219.9.22:3000")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
