package com.sentinel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

@SpringBootApplication
public class SentinelBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SentinelBackendApplication.class, args);
    }

}
