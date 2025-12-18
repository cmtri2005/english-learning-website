FROM minio/mc:latest

COPY ingest.sh /ingest.sh
RUN chmod +x /ingest.sh

ENTRYPOINT ["/ingest.sh"]
