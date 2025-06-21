package com.sentinel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class DeviceMetricsController {

    private final DeviceMetricsRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    public DeviceMetricsController(DeviceMetricsRepository repo, SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/metrics")
    public DeviceMetrics submitMetrics(@RequestBody DeviceMetrics metrics) {
        System.out.println("✅ Received metrics from: " + metrics.getDeviceId());
        metrics.setTimestamp(LocalDateTime.now());
        DeviceMetrics saved = repo.save(metrics);

        // Push new metrics to subscribers of this deviceId
        messagingTemplate.convertAndSend("/topic/metrics/" + saved.getDeviceId(), saved);
        return saved;
    }
    // Pagination + filtering
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


    //return statuses
@GetMapping("/metrics/status")
public List<DeviceStatus> getDeviceStatuses() {
    List<DeviceStatus> statuses = new ArrayList<>();

    List<String> deviceIds = repo.findDistinctDeviceIds();
    for (String deviceId : deviceIds) {
        DeviceMetrics latest = repo.findTopByDeviceIdOrderByTimestampDesc(deviceId);
        if (latest != null) {
            // Example logic for online: last heartbeat < 10 sec ago
            boolean online = latest.getTimestamp().isAfter(LocalDateTime.now().minusSeconds(120));
            statuses.add(new DeviceStatus(deviceId, latest.getTimestamp(), online));
        }
    }

    return statuses;
}

    // List all distinct devices reporting in
    @GetMapping("/devices")
    public List<String> getAllDeviceIds() {
        return repo.findDistinctDeviceIds();
    }

    // Latest snapshot per device
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

}









