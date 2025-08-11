package com.sentinel;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DeviceMetricsRepository extends JpaRepository<DeviceMetrics, Long> {

    Page<DeviceMetrics> findByDeviceIdOrderByTimestampDesc(String deviceId, Pageable pageable);

    Page<DeviceMetrics> findByDeviceIdAndTimestampBetween(String deviceId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<DeviceMetrics> findByDeviceIdAndTimestampAfter(String deviceId, LocalDateTime from, Pageable pageable);

    Page<DeviceMetrics> findByDeviceIdAndTimestampBefore(String deviceId, LocalDateTime to, Pageable pageable);

    DeviceMetrics findTopByDeviceIdOrderByTimestampDesc(String deviceId);

    @Modifying
    @Transactional
    @Query("DELETE FROM DeviceMetrics dm WHERE dm.deviceId = :deviceId")
    void deleteByDeviceId(@Param("deviceId") String deviceId);

    @Query("SELECT DISTINCT dm.deviceId FROM DeviceMetrics dm")
    List<String> findDistinctDeviceIds();

}
