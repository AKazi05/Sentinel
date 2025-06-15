package com.sentinel;

import com.sentinel.DeviceMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeviceMetricsRepository extends JpaRepository<DeviceMetrics, Long> {
    List<DeviceMetrics> findByDeviceIdOrderByTimestampDesc(String deviceId);
}
