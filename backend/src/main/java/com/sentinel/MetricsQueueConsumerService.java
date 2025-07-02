package com.sentinel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

@Service
public class MetricsQueueConsumerService {

    private static final Logger logger = LoggerFactory.getLogger(MetricsQueueConsumerService.class);

    private final DeviceMetricsRepository repo;
    private final BlockingQueue<DeviceMetrics> metricsQueue;

    private volatile boolean running = true;
    private Thread workerThread;

    private static final int BATCH_SIZE = 20;
    private static final Duration POLL_TIMEOUT = Duration.ofSeconds(5);

    public MetricsQueueConsumerService(DeviceMetricsRepository repo, BlockingQueue<DeviceMetrics> metricsQueue) {
        this.repo = repo;
        this.metricsQueue = metricsQueue;
    }

    @PostConstruct
    public void start() {
        workerThread = new Thread(this::processQueue, "MetricsQueueConsumerThread");
        workerThread.start();
        logger.info("Started MetricsQueueConsumerService");
    }

    @PreDestroy
    public void stop() {
        running = false;
        workerThread.interrupt();
        try {
            workerThread.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        logger.info("Stopped MetricsQueueConsumerService");
    }

    private void processQueue() {
        List<DeviceMetrics> batch = new ArrayList<>();
        while (running) {
            try {
                DeviceMetrics metric = metricsQueue.poll(POLL_TIMEOUT.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
                if (metric != null) {
                    batch.add(metric);
                }

                if (batch.size() >= BATCH_SIZE || (metric == null && !batch.isEmpty())) {
                    repo.saveAll(batch);
                    logger.info("Saved batch of {} metrics", batch.size());
                    batch.clear();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.warn("MetricsQueueConsumerThread interrupted");
            } catch (Exception e) {
                logger.error("Error saving batch metrics", e);
            }
        }

        // Final flush on shutdown
        if (!batch.isEmpty()) {
            try {
                repo.saveAll(batch);
                logger.info("Saved final batch of {} metrics on shutdown", batch.size());
            } catch (Exception e) {
                logger.error("Error saving final batch metrics", e);
            }
        }
    }
}
