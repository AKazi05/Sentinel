# Sentinel - Distributed System Monitoring Platform

**Sentinel** is a real-time monitoring platform for tracking performance metrics across distributed devices or containers. It provides insight into CPU, memory, disk I/O, network traffic, latency, and system uptime through a user-friendly dashboard.

---

## 🧠 Features

- Real-time metric collection via lightweight Python agents
- RESTful APIs and WebSocket endpoints using Spring Boot
- Live streaming of performance data
- Persistent storage of historical metrics in PostgreSQL
- Responsive React frontend with visual alerts and device selection
- Offline device detection and alerting system
- Dockerized agent, backend, and frontend for easy deployment

---

## 🏗️ Architecture


+----------------+       +-------------+       +----------------+
| Python Agent   |  -->  | Spring Boot |  -->  | PostgreSQL     |
| (Host/Container)|      | Backend API |       | (Metrics DB)   |
+----------------+       +-------------+       +----------------+
                                |
                                v
                         +-------------+
                         | React Frontend |
                         | (Live UI)      |
                         +---------------+