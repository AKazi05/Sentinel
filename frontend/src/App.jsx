import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState([]);

  // Load device list
  useEffect(() => {
    axios.get('http://localhost:8080/api/devices')
      .then(res => {
        const devicesArray = Array.isArray(res.data) ? res.data : res.data.content || [];
        setDevices(devicesArray);
        if (devicesArray.length > 0) setDeviceId(devicesArray[0]);
      })
      .catch(console.error);
  }, []);

  // Load initial metrics on deviceId change
  useEffect(() => {
    if (!deviceId) return;

    axios.get(`http://localhost:8080/api/metrics/${deviceId}`)
      .then(res => {
        const metricsArray = Array.isArray(res.data.content) ? res.data.content : [];
        setMetrics(metricsArray);
      })
      .catch(console.error);
  }, [deviceId]);

useEffect(() => {
  if (!deviceId) return;

  const socket = new SockJS('http://localhost:8080/ws');
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
    });
  };

  client.activate();
  return () => {
    client.deactivate();
    console.log('🔌 Disconnected from WS');
  };
}, [deviceId]);

  // Poll device statuses every 5s
  useEffect(() => {
    const fetchStatuses = () => {
      axios.get('http://localhost:8080/api/metrics/status')
        .then(res => {
          const statuses = Array.isArray(res.data) ? res.data : [];
          setDeviceStatuses(Array.isArray(statuses) ? statuses : []);
        })
        .catch(console.error);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <h1>Sentinel Monitoring Dashboard</h1>

      <div className="device-status-list">
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
                <td style={{ color: d.online ? 'green' : 'red' }}>
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
                (m.cpuUsage > 90 || m.memoryUsage > 90 || m.diskUsage > 90)
                  ? "#ffebeb"
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
              <td colSpan="11">No data available for this device.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
