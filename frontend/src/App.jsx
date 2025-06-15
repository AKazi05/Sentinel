import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [metrics, setMetrics] = useState([]);
  const [deviceId, setDeviceId] = useState("device-001");

  useEffect(() => {
    axios.get(`http://localhost:8080/api/metrics/${deviceId}`)
      .then(res => setMetrics(res.data))
      .catch(err => console.error(err));
  }, [deviceId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Sentinel Dashboard</h1>
      <input
        type="text"
        value={deviceId}
        onChange={e => setDeviceId(e.target.value)}
        className="border p-2 mb-4"
        placeholder="Enter Device ID"
      />
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-2">Timestamp</th>
            <th className="border px-2">CPU %</th>
            <th className="border px-2">Memory %</th>
            <th className="border px-2">Disk %</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr key={i}>
              <td className="border px-2">{new Date(m.timestamp).toLocaleString()}</td>
              <td className="border px-2">{m.cpuUsage}</td>
              <td className="border px-2">{m.memoryUsage}</td>
              <td className="border px-2">{m.diskUsage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
