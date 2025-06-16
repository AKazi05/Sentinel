package com.sentinel;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
public class DeviceMetricsController {

    private final DeviceMetricsRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    // Set your thresholds
    final double CPU_THRESHOLD = 90.0;
    final double MEMORY_THRESHOLD = 90.0;
    final double DISK_THRESHOLD = 90.0;

    public DeviceMetricsController(DeviceMetricsRepository repo, SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
    }

@PostMapping
public DeviceMetrics submitMetrics(@RequestBody DeviceMetrics metrics) {
    metrics.setTimestamp(LocalDateTime.now());
    DeviceMetrics saved = repo.save(metrics);

    // Send new metrics to all subscribers
    messagingTemplate.convertAndSend("/topic/metrics/" + saved.getDeviceId(), saved);

    // Alert logic
    boolean cpuHigh = saved.getCpuUsage() > CPU_THRESHOLD;
    boolean memHigh = saved.getMemoryUsage() > MEMORY_THRESHOLD;
    boolean diskHigh = saved.getDiskUsage() > DISK_THRESHOLD;

    if (cpuHigh || memHigh || diskHigh) {
        String alertMessage = "⚠️ High usage on " + saved.getDeviceId() + ": " +
            (cpuHigh ? "CPU " + saved.getCpuUsage() + "% " : "") +
            (memHigh ? "Memory " + saved.getMemoryUsage() + "% " : "") +
            (diskHigh ? "Disk " + saved.getDiskUsage() + "% " : "");

        messagingTemplate.convertAndSend("/topic/alerts/" + saved.getDeviceId(), alertMessage);
    }

    return saved;
}

    @GetMapping("/{deviceId}")
    public List<DeviceMetrics> getMetrics(@PathVariable String deviceId) {
        return repo.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    @GetMapping("/devices")
    public List<String> getAllDeviceIds() {
        return repo.findDistinctDeviceIds();
    }

    @GetMapping("/status")
    public List<DeviceStatus> getDeviceStatuses() {
        List<DeviceMetrics> all = repo.findAll();
        Map<String, LocalDateTime> latestByDevice = new HashMap<>();

        for (DeviceMetrics m : all) {
            latestByDevice.merge(
                m.getDeviceId(),
                m.getTimestamp(),
                (oldVal, newVal) -> newVal.isAfter(oldVal) ? newVal : oldVal
            );
        }

        LocalDateTime now = LocalDateTime.now();
        List<DeviceStatus> statuses = new ArrayList<>();

        for (Map.Entry<String, LocalDateTime> entry : latestByDevice.entrySet()) {
            boolean isOnline = entry.getValue().isAfter(now.minusMinutes(2));
            statuses.add(new DeviceStatus(entry.getKey(), entry.getValue(), isOnline));
        }

        return statuses;
    }
}
