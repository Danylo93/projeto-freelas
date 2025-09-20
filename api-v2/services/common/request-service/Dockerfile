FROM python:3.11-slim

WORKDIR /app

# Install curl for container health checks
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY request-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

WORKDIR /app

EXPOSE 8012

CMD ["uvicorn", "request-service.main_ultra_simple:app", "--host", "0.0.0.0", "--port", "8011"]
