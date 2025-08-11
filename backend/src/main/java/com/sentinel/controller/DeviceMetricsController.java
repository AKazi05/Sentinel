package com.sentinel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

@RestController
@RequestMapping("/api")
public class DeviceMetricsController {

    private final DeviceMetricsRepository repo;
    private final SimpMessagingTemplate messagingTemplate;
    private final BlockingQueue<DeviceMetrics> metricsQueue;

    public DeviceMetricsController(DeviceMetricsRepository repo,
                                   SimpMessagingTemplate messagingTemplate,
                                   BlockingQueue<DeviceMetrics> metricsQueue) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
        this.metricsQueue = metricsQueue;
    }

    @PostMapping("/metrics")
    public ResponseEntity<String> submitMetrics(@RequestBody DeviceMetrics metrics) {
        metrics.setTimestamp(LocalDateTime.now());
        metricsQueue.offer(metrics); // enqueue instead of saving immediately

        messagingTemplate.convertAndSend("/topic/metrics/" + metrics.getDeviceId(), metrics);
        return ResponseEntity.ok("Metric accepted");
    }
    
    @PostMapping("/metrics/batch")
    public ResponseEntity<String> submitMetricsBatch(@RequestBody List<DeviceMetrics> metricsList) {
        for (DeviceMetrics metrics : metricsList) {
            metrics.setTimestamp(LocalDateTime.now());
            metricsQueue.offer(metrics);
            messagingTemplate.convertAndSend("/topic/metrics/" + metrics.getDeviceId(), metrics);
        }
        return ResponseEntity.ok("Batch accepted");
    }

    @GetMapping("/metrics/{deviceId}")
    public Page<DeviceMetrics> getMetrics(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String fromTimestamp,
            @RequestParam(required = false) String toTimestamp) {

        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime from = (fromTimestamp != null) ? LocalDateTime.parse(fromTimestamp) : null;
        LocalDateTime to = (toTimestamp != null) ? LocalDateTime.parse(toTimestamp) : null;

        if (from != null && to != null) {
            return repo.findByDeviceIdAndTimestampBetween(deviceId, from, to, pageable);
        } else if (from != null) {
            return repo.findByDeviceIdAndTimestampAfter(deviceId, from, pageable);
        } else if (to != null) {
            return repo.findByDeviceIdAndTimestampBefore(deviceId, to, pageable);
        } else {
            return repo.findByDeviceIdOrderByTimestampDesc(deviceId, pageable);
        }
    }

    @GetMapping("/metrics/status")
    public List<DeviceStatus> getDeviceStatuses() {
        List<DeviceStatus> statuses = new ArrayList<>();
        List<String> deviceIds = repo.findDistinctDeviceIds();
        for (String deviceId : deviceIds) {
            DeviceMetrics latest = repo.findTopByDeviceIdOrderByTimestampDesc(deviceId);
            if (latest != null) {
                boolean online = latest.getTimestamp().isAfter(LocalDateTime.now().minusSeconds(120));
                statuses.add(new DeviceStatus(deviceId, latest.getTimestamp(), online));
            }
        }
        return statuses;
    }

    @GetMapping("/devices")
    public List<String> getAllDeviceIds() {
        return repo.findDistinctDeviceIds();
    }

    @GetMapping("/metrics/latest")
    public List<DeviceMetrics> getLatestMetrics() {
        List<String> deviceIds = repo.findDistinctDeviceIds();
        List<DeviceMetrics> latestMetrics = new ArrayList<>();
        for (String deviceId : deviceIds) {
            DeviceMetrics latest = repo.findTopByDeviceIdOrderByTimestampDesc(deviceId);
            if (latest != null) {
                latestMetrics.add(latest);
            }
        }
        return latestMetrics;
    }

    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<Void> deleteDevice(@PathVariable String deviceId) {
        repo.deleteByDeviceId(deviceId);
        return ResponseEntity.noContent().build();
    }
}
