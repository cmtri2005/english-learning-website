FROM python:3.11-slim

# Install MinIO client
RUN apt-get update && apt-get install -y curl && \
    curl -O https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && mv mc /usr/local/bin/ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies for dictionary processing
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt || true

# Copy scripts
COPY ingest.sh /ingest.sh
COPY ingest_dictionary.py /ingest_dictionary.py
RUN chmod +x /ingest.sh

ENTRYPOINT ["/ingest.sh"]
