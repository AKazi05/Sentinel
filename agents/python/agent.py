import psutil
import requests
import socket
import time
import logging

# ====== CONFIGURATION ======
SERVER_URL = "http://192.168.1.100:8080/api/metrics"  # Replace with your backend IP
DEVICE_ID = socket.gethostname()                      # Or use custom unique ID
INTERVAL_SECONDS = 30
MAX_RETRIES = 3
# ============================

# Setup logging
logging.basicConfig(
    filename="sentinel-agent.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def collect_metrics():
    return {
        "deviceId": DEVICE_ID,
        "cpuUsage": psutil.cpu_percent(interval=1),
        "memoryUsage": psutil.virtual_memory().percent,
        "diskUsage": psutil.disk_usage('/').percent
    }

def send_metrics(metrics):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(SERVER_URL, json=metrics, timeout=5)
            if response.status_code == 200 or response.status_code == 201:
                logging.info(f"Metrics sent: {metrics}")
                return True
            else:
                logging.warning(f"Unexpected status code {response.status_code}")
        except Exception as e:
            logging.error(f"Error on attempt {attempt}: {e}")
            time.sleep(2 * attempt)  # Exponential backoff
    logging.error("Failed to send metrics after retries.")
    return False

def run():
    logging.info("Sentinel Agent Started.")
    while True:
        metrics = collect_metrics()
        success = send_metrics(metrics)
        if not success:
            logging.warning("Metrics not sent; will retry next cycle.")
        time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    run()
