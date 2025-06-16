package com.sentinel;

import com.sentinel.DeviceMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

public interface DeviceMetricsRepository extends JpaRepository<DeviceMetrics, Long> {
    List<DeviceMetrics> findByDeviceIdOrderByTimestampDesc(String deviceId);

    @Query("SELECT DISTINCT dm.deviceId FROM DeviceMetrics dm")
    List<String> findDistinctDeviceIds();
}
