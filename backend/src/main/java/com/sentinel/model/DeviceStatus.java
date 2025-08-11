package com.sentinel;

import java.time.LocalDateTime;

public class DeviceStatus {
    private String deviceId;
    private LocalDateTime lastHeartbeat;
    private boolean online;

    public DeviceStatus(String deviceId, LocalDateTime lastHeartbeat, boolean online) {
        this.deviceId = deviceId;
        this.lastHeartbeat = lastHeartbeat;
        this.online = online;
    }

    public String getDeviceId() { return deviceId; }
    public LocalDateTime getLastHeartbeat() { return lastHeartbeat; }
    public boolean isOnline() { return online; }
}
