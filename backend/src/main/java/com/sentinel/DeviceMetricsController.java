package com.sentinel;

import com.sentinel.DeviceMetrics;
import com.sentinel.DeviceMetricsRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
public class DeviceMetricsController {

    private final DeviceMetricsRepository repo;

    public DeviceMetricsController(DeviceMetricsRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public DeviceMetrics submitMetrics(@RequestBody DeviceMetrics metrics) {
        // Convert LocalDateTime.now() to java.sql.Timestamp before setting
    metrics.setTimestamp(LocalDateTime.now());

        return repo.save(metrics);
    }

    @GetMapping("/{deviceId}")
    public List<DeviceMetrics> getMetrics(@PathVariable String deviceId) {
        return repo.findByDeviceIdOrderByTimestampDesc(deviceId);
    }
}
