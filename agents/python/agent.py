import psutil
import requests
import socket
import time
import logging
import json
import os

# ====== CONFIGURATION ======
SERVER_URL = "http://localhost:8080/api/metrics"
DEVICE_ID = socket.gethostname()
INTERVAL_SECONDS = 30
MAX_RETRIES = 3
BUFFER_FILE = "unsent_metrics.json"
# ============================

# Setup logging
logging.basicConfig(
    filename="sentinel-agent.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def get_network_traffic():
    net1 = psutil.net_io_counters()
    time.sleep(1)
    net2 = psutil.net_io_counters()
    return net2.bytes_sent - net1.bytes_sent, net2.bytes_recv - net1.bytes_recv

def get_system_uptime():
    return time.time() - psutil.boot_time()

def get_disk_io():
    disk1 = psutil.disk_io_counters()
    time.sleep(1)
    disk2 = psutil.disk_io_counters()
    return disk2.read_bytes - disk1.read_bytes, disk2.write_bytes - disk1.write_bytes

def get_latency(host="8.8.8.8"):
    try:
        start = time.time()
        socket.create_connection((host, 53), timeout=2)
        latency_ms = (time.time() - start) * 1000
        return latency_ms
    except Exception:
        return None

def collect_metrics():
    bytes_sent, bytes_recv = get_network_traffic()
    disk_read, disk_write = get_disk_io()
    return {
        "deviceId": socket.gethostname(),
        "cpuUsage": psutil.cpu_percent(interval=1),
        "memoryUsage": psutil.virtual_memory().percent,
        "diskUsage": psutil.disk_usage('/').percent,
        "bytesSentPerSec": bytes_sent,
        "bytesRecvPerSec": bytes_recv,
        "systemUptimeSeconds": get_system_uptime(),
        "diskReadBytesPerSec": disk_read,
        "diskWriteBytesPerSec": disk_write,
        "latencyMs": get_latency()
    }

def send_metrics(metrics):
    """Send metrics to the server with retries."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(SERVER_URL, json=metrics, timeout=5)
            if response.status_code in [200, 201]:
                logging.info(f"Metrics sent: {metrics}")
                return True
            else:
                logging.warning(f"Unexpected status code {response.status_code}")
        except Exception as e:
            logging.error(f"Send attempt {attempt} failed: {e}")
            time.sleep(2 * attempt)  # Exponential backoff
    return False

def save_to_buffer(metrics):
    """Save unsent metrics locally to a buffer file."""
    buffer = []
    if os.path.exists(BUFFER_FILE):
        try:
            with open(BUFFER_FILE, "r") as f:
                buffer = json.load(f)
        except json.JSONDecodeError:
            logging.warning("Buffer file corrupted. Resetting buffer.")
            buffer = []
    buffer.append(metrics)
    with open(BUFFER_FILE, "w") as f:
        json.dump(buffer, f)
    logging.info("Saved metrics to buffer.")

def flush_buffer():
    """Attempt to resend buffered metrics."""
    if not os.path.exists(BUFFER_FILE):
        return

    try:
        with open(BUFFER_FILE, "r") as f:
            buffer = json.load(f)
    except json.JSONDecodeError:
        logging.error("Buffer file corrupted, deleting.")
        os.remove(BUFFER_FILE)
        return

    if not buffer:
        return

    failed_metrics = []
    for metric in buffer:
        if not send_metrics(metric):
            failed_metrics.append(metric)

    if failed_metrics:
        with open(BUFFER_FILE, "w") as f:
            json.dump(failed_metrics, f)
        logging.info(f"{len(failed_metrics)} buffered metrics retained.")
    else:
        os.remove(BUFFER_FILE)
        logging.info("Buffer flushed successfully.")

def run():
    logging.info("Sentinel Agent Started.")
    while True:
        flush_buffer()
        metrics = collect_metrics()
        if not send_metrics(metrics):
            save_to_buffer(metrics)
        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    run()
