FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default device ID path (can be overridden with ENV)
ENV DEVICE_ID_FILE=/app/device_data/device_id.json

# Ensure the directory exists inside container
RUN mkdir -p /app/device_data

CMD ["python", "agent.py"]
