import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from './api';  // Use your custom axios instance with token interceptor
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const CPU_THRESHOLD = 90;
  const MEMORY_THRESHOLD = 90;
  const DISK_THRESHOLD = 90;

  // --- Logout handler ---
  const handleLogout = () => {
    localStorage.removeItem('token');  // Remove JWT token
    // If you have user state, reset it here, e.g. setUser(null);
    window.location.href = '/login';   // Redirect to login page
  };

  useEffect(() => {
    const fetchStatuses = () => {
      api.get('/api/metrics/status')
        .then(res => {
          const statuses = Array.isArray(res.data) ? res.data : [];
          setDeviceStatuses(statuses);

          const statusDeviceIds = statuses.map(d => d.deviceId);
          setDevices(prevDevices => {
            const mergedDevices = Array.from(new Set([...prevDevices, ...statusDeviceIds]));
            if (!mergedDevices.includes(deviceId)) {
              setDeviceId(mergedDevices.length > 0 ? mergedDevices[0] : '');
            }
            return mergedDevices;
          });
        })
        .catch(err => {
          console.warn('❌ Failed to fetch statuses:', err);
        });
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) {
      setMetrics([]);
      return;
    }

    api.get(`/api/metrics/${deviceId}`)
      .then(res => {
        const metricsArray = Array.isArray(res.data.content) ? res.data.content : [];
        setMetrics(metricsArray);
      })
      .catch(err => {
        console.warn('❌ Failed to fetch metrics:', err);
      });
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    const socket = new SockJS(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: str => console.log(str),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log(`✅ Connected to WS for device ${deviceId}`);
      client.subscribe(`/topic/metrics/${deviceId}`, (message) => {
        const newMetric = JSON.parse(message.body);
        setMetrics(prev => [newMetric, ...prev]);

        const newAlerts = [];
        if (newMetric.cpuUsage > CPU_THRESHOLD)
          newAlerts.push(`⚠️ High CPU on ${deviceId}: ${newMetric.cpuUsage.toFixed(1)}%`);
        if (newMetric.memoryUsage > MEMORY_THRESHOLD)
          newAlerts.push(`⚠️ High Memory on ${deviceId}: ${newMetric.memoryUsage.toFixed(1)}%`);
        if (newMetric.diskUsage > DISK_THRESHOLD)
          newAlerts.push(`⚠️ High Disk on ${deviceId}: ${newMetric.diskUsage.toFixed(1)}%`);

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
      console.log('🔌 WS disconnected');
    };
  }, [deviceId]);

  const handleDeleteDevice = async () => {
    if (!deviceId) return;
    if (!window.confirm(`Are you sure you want to delete "${deviceId}"?`)) return;

    try {
      await api.delete(`/api/devices/${deviceId}`);
      alert(`Device "${deviceId}" deleted`);
      setDevices(prev => {
        const updated = prev.filter(d => d !== deviceId);
        setDeviceId(updated.length > 0 ? updated[0] : '');
        return updated;
      });
      setMetrics([]);
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('Failed to delete device.');
    }
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="main-title">Sentinel Monitoring Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      <div className="alerts-section">
        <h2>Alerts</h2>
        {alerts.length === 0 ? <p>No alerts.</p> : (
          <ul className="alert-list">
            {alerts.map((alert, idx) => <li key={idx}>{alert}</li>)}
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
                <tr><td colSpan="3">No device statuses available.</td></tr>
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
              {devices.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          {deviceId && (
            <button onClick={handleDeleteDevice}>🗑 Remove Device</button>
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
                    ? "#ffe6e6" : "white"
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
              <tr><td colSpan="10">No data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
