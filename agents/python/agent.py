import psutil
import requests
import socket
import time
import logging
import json
import os
import uuid

# ====== CONFIGURATION ======
SERVER_URL = "http://192.168.12.115:8080/api/metrics/batch"
LOGIN_URL = "http://192.168.12.115:8080/login"
DEVICE_ID_FILE = "agents/python/device_data/device_id.json"
INTERVAL_SECONDS = 3
MAX_RETRIES = 3
BUFFER_FILE = "unsent_metrics.json"
BATCH_SIZE = 5

USERNAME = os.getenv("AGENT_USERNAME", "agent")
PASSWORD = os.getenv("AGENT_PASSWORD", "pass")
# ============================

logging.basicConfig(
    filename="agents/python/sentinel-agent.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def get_or_create_device_id():
    if os.path.exists(DEVICE_ID_FILE):
        try:
            with open(DEVICE_ID_FILE, 'r') as f:
                return json.load(f)['device_id']
        except Exception as e:
            logging.warning(f"Could not read device ID file: {e}")

    hostname = socket.gethostname()
    mac = uuid.getnode()
    device_id = f"{hostname}-{mac}"

    try:
        os.makedirs(os.path.dirname(DEVICE_ID_FILE), exist_ok=True)
        with open(DEVICE_ID_FILE, 'w') as f:
            json.dump({'device_id': device_id}, f)
        logging.info(f"Generated new device ID: {device_id}")
    except Exception as e:
        logging.error(f"Failed to write device ID file: {e}")

    return device_id

DEVICE_ID = os.getenv("DEVICE_ID", get_or_create_device_id())

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
        "deviceId": DEVICE_ID,
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

def get_jwt_token():
    try:
        resp = requests.post(LOGIN_URL, json={"username": USERNAME, "password": PASSWORD}, timeout=5)
        resp.raise_for_status()
        token = resp.json().get("token")
        if token:
            logging.info("Obtained JWT token from login.")
            return token
        else:
            logging.error("Login response missing token.")
            return None
    except Exception as e:
        logging.error(f"Login failed: {e}")
        return None

def send_metrics_batch(metrics_batch, token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(SERVER_URL, json=metrics_batch, headers=headers, timeout=5)
            if response.status_code in [200, 201]:
                logging.info(f"Batch sent successfully with {len(metrics_batch)} metrics.")
                return True, None
            elif response.status_code == 401:
                return False, 401
            else:
                logging.warning(f"Unexpected status code {response.status_code}")
        except Exception as e:
            logging.error(f"Send attempt {attempt} failed: {e}")
            time.sleep(2 * attempt)
    return False, None

def save_to_buffer(metrics):
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

def flush_buffer(token):
    if not os.path.exists(BUFFER_FILE):
        return True

    try:
        with open(BUFFER_FILE, "r") as f:
            buffer = json.load(f)
    except json.JSONDecodeError:
        logging.error("Buffer file corrupted, deleting.")
        os.remove(BUFFER_FILE)
        return True

    if not buffer:
        return True

    failed_metrics = []
    for metric in buffer:
        success, status = send_metrics_batch([metric], token)
        if not success:
            failed_metrics.append(metric)
            if status == 401:
                logging.warning("401 during buffer flush, will refresh token.")
                break

    if failed_metrics:
        with open(BUFFER_FILE, "w") as f:
            json.dump(failed_metrics, f)
        logging.info(f"{len(failed_metrics)} buffered metrics retained.")
        return False
    else:
        os.remove(BUFFER_FILE)
        logging.info("Buffer flushed successfully.")
        return True

def run():
    logging.info("Sentinel Agent Started.")
    token = get_jwt_token()
    if not token:
        logging.error("Could not authenticate on startup. Exiting.")
        return

    metric_batch = []

    while True:
        flushed = flush_buffer(token)
        if not flushed:
            token = get_jwt_token()
            if not token:
                time.sleep(INTERVAL_SECONDS)
                continue

        metric = collect_metrics()
        metric_batch.append(metric)

        if len(metric_batch) >= BATCH_SIZE:
            success, status = send_metrics_batch(metric_batch, token)
            if not success:
                if status == 401:
                    token = get_jwt_token()
                    if token:
                        success, _ = send_metrics_batch(metric_batch, token)
                if not success:
                    for m in metric_batch:
                        save_to_buffer(m)
            metric_batch.clear()

        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    run()
