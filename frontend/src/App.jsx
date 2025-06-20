import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error('Missing REACT_APP_BACKEND_URL environment variable');
}

function App() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const CPU_THRESHOLD = 90;
  const MEMORY_THRESHOLD = 90;
  const DISK_THRESHOLD = 90;

  // Sync devices list with deviceStatuses every 5 seconds
  useEffect(() => {
    const fetchStatuses = () => {
      axios.get(`${BACKEND_URL}/api/metrics/status`)
        .then(res => {
          const statuses = Array.isArray(res.data) ? res.data : [];
          setDeviceStatuses(statuses);

          // Extract device IDs from statuses
          const statusDeviceIds = statuses.map(d => d.deviceId);

          setDevices(prevDevices => {
            // Merge old and new devices uniquely
            const mergedDevices = Array.from(new Set([...prevDevices, ...statusDeviceIds]));

            // If current deviceId is missing, select first available or empty
            if (!mergedDevices.includes(deviceId)) {
              if (mergedDevices.length > 0) {
                setDeviceId(mergedDevices[0]);
              } else {
                setDeviceId('');
              }
            }
            return mergedDevices;
          });
        })
        .catch(console.error);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  // Load initial metrics on deviceId change
  useEffect(() => {
    if (!deviceId) {
      setMetrics([]);
      return;
    }

    axios.get(`${BACKEND_URL}/api/metrics/${deviceId}`)
      .then(res => {
        const metricsArray = Array.isArray(res.data.content) ? res.data.content : [];
        setMetrics(metricsArray);
      })
      .catch(console.error);
  }, [deviceId]);

  // WebSocket connection for real-time metrics
  useEffect(() => {
    if (!deviceId) return;

    const socket = new SockJS(`${BACKEND_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log(`✅ Connected to WS for device ${deviceId}`);
      client.subscribe(`/topic/metrics/${deviceId}`, (message) => {
        console.log('📡 WS msg received:', message.body);
        const newMetric = JSON.parse(message.body);
        setMetrics(prev => [newMetric, ...prev]);

        // Check for alerts
        const newAlerts = [];
        if (newMetric.cpuUsage > CPU_THRESHOLD) {
          newAlerts.push(`⚠️ High CPU usage on ${deviceId}: ${newMetric.cpuUsage.toFixed(1)}%`);
        }
        if (newMetric.memoryUsage > MEMORY_THRESHOLD) {
          newAlerts.push(`⚠️ High Memory usage on ${deviceId}: ${newMetric.memoryUsage.toFixed(1)}%`);
        }
        if (newMetric.diskUsage > DISK_THRESHOLD) {
          newAlerts.push(`⚠️ High Disk usage on ${deviceId}: ${newMetric.diskUsage.toFixed(1)}%`);
        }

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
      console.log('🔌 Disconnected from WS');
    };
  }, [deviceId]);

  // Delete device handler
  const handleDeleteDevice = async () => {
    if (!deviceId) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete device "${deviceId}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/devices/${deviceId}`);
      alert(`Device "${deviceId}" deleted successfully.`);
      setDevices(prev => {
        const updatedDevices = prev.filter(d => d !== deviceId);
        if (updatedDevices.length > 0) {
          setDeviceId(updatedDevices[0]);
        } else {
          setDeviceId('');
        }
        return updatedDevices;
      });
      setMetrics([]);
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('Failed to delete device.');
    }
  };

  return (
    <div className="app-container">
      <h1 className="main-title">Sentinel Monitoring Dashboard</h1>

      {/* Alerts */}
      <div className="alerts-section">
        <h2>Alerts</h2>
        {alerts.length === 0 ? (
          <p>No alerts.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((alert, idx) => (
              <li key={idx} className="alert-item">{alert}</li>
            ))}
          </ul>
        )}
        {alerts.length > 0 && (
          <button onClick={() => setAlerts([])} className="clear-alerts-btn">Clear Alerts</button>
        )}
      </div>

      <div className="status-and-selector">
        <div className="device-health">
          <h2>Device Health</h2>
          <table className="device-status-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Last Heartbeat</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deviceStatuses.length > 0 ? deviceStatuses.map((d, i) => (
                <tr key={i}>
                  <td>{d.deviceId}</td>
                  <td>{d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleString() : "N/A"}</td>
                  <td className={d.online ? 'status-online' : 'status-offline'}>
                    {d.online ? 'Online' : 'Offline'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3">No device statuses available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="device-selector">
          <label>
            Select Device:{" "}
            <select
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              disabled={devices.length === 0}
            >
              {devices.length > 0 ? devices.map(d => (
                <option key={d} value={d}>{d}</option>
              )) : (
                <option value="">No devices available</option>
              )}
            </select>
          </label>
          {deviceId && (
            <button onClick={handleDeleteDevice}>
              🗑 Remove Device
            </button>
          )}
        </div>
      </div>

      <div className="metrics-section">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>CPU (%)</th>
              <th>Memory (%)</th>
              <th>Disk (%)</th>
              <th>Bytes Sent/s</th>
              <th>Bytes Received/s</th>
              <th>Disk Read/s</th>
              <th>Disk Write/s</th>
              <th>Latency (ms)</th>
              <th>Uptime (s)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length > 0 ? metrics.map((m, i) => (
              <tr key={i} style={{
                backgroundColor:
                  (m.cpuUsage > CPU_THRESHOLD || m.memoryUsage > MEMORY_THRESHOLD || m.diskUsage > DISK_THRESHOLD)
                    ? "#ffe6e6"
                    : "white"
              }}>
                <td>{m.timestamp ? new Date(m.timestamp).toLocaleString() : "N/A"}</td>
                <td>{m.cpuUsage?.toFixed(1) ?? '—'}</td>
                <td>{m.memoryUsage?.toFixed(1) ?? '—'}</td>
                <td>{m.diskUsage?.toFixed(1) ?? '—'}</td>
                <td>{m.bytesSentPerSec ?? '—'}</td>
                <td>{m.bytesRecvPerSec ?? '—'}</td>
                <td>{m.diskReadBytesPerSec ?? '—'}</td>
                <td>{m.diskWriteBytesPerSec ?? '—'}</td>
                <td>{m.latencyMs ?? '—'}</td>
                <td>{m.systemUptimeSeconds?.toFixed(0) ?? '—'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="10">No data available for this device.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
