package com.sentinel;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class DeviceMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceId;
    private double cpuUsage;
    private double memoryUsage;
    private double diskUsage;

    private Long bytesSentPerSec;
    private Long bytesRecvPerSec;

    private Long diskReadBytesPerSec;
    private Long diskWriteBytesPerSec;

    private Double latencyMs; // nullable

    private Double systemUptimeSeconds;

    private LocalDateTime timestamp;

    // Getters
    public Long getId() {
        return id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public double getCpuUsage() {
        return cpuUsage;
    }

    public double getMemoryUsage() {
        return memoryUsage;
    }

    public double getDiskUsage() {
        return diskUsage;
    }

    public Long getBytesSentPerSec() {
        return bytesSentPerSec;
    }

    public Long getBytesRecvPerSec() {
        return bytesRecvPerSec;
    }

    public Long getDiskReadBytesPerSec() {
        return diskReadBytesPerSec;
    }

    public Long getDiskWriteBytesPerSec() {
        return diskWriteBytesPerSec;
    }

    public Double getLatencyMs() {
        return latencyMs;
    }

    public Double getSystemUptimeSeconds() {
        return systemUptimeSeconds;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public void setCpuUsage(double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public void setMemoryUsage(double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }

    public void setDiskUsage(double diskUsage) {
        this.diskUsage = diskUsage;
    }

    public void setBytesSentPerSec(Long bytesSentPerSec) {
        this.bytesSentPerSec = bytesSentPerSec;
    }

    public void setBytesRecvPerSec(Long bytesRecvPerSec) {
        this.bytesRecvPerSec = bytesRecvPerSec;
    }

    public void setDiskReadBytesPerSec(Long diskReadBytesPerSec) {
        this.diskReadBytesPerSec = diskReadBytesPerSec;
    }

    public void setDiskWriteBytesPerSec(Long diskWriteBytesPerSec) {
        this.diskWriteBytesPerSec = diskWriteBytesPerSec;
    }

    public void setLatencyMs(Double latencyMs) {
        this.latencyMs = latencyMs;
    }

    public void setSystemUptimeSeconds(Double systemUptimeSeconds) {
        this.systemUptimeSeconds = systemUptimeSeconds;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
