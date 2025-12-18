#!/bin/sh
set -eu

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minioalt:9000}"
MINIO_USER="${MINIO_USER:-minioadmin}"
MINIO_PASSWORD="${MINIO_PASSWORD:-minioadmin123}"
BUCKET="${BUCKET:-my-bucket}"
SEED_DIR="${SEED_DIR:-/seed}"
PUBLIC_DOWNLOAD="${PUBLIC_DOWNLOAD:-false}"

if [ ! -d "$SEED_DIR" ]; then
  echo "❌ SEED_DIR not found: $SEED_DIR"
  exit 1
fi

echo "⏳ Waiting for MinIO at $MINIO_ENDPOINT ..."
i=1
while [ $i -le 30 ]; do
  if mc alias set local "$MINIO_ENDPOINT" "$MINIO_USER" "$MINIO_PASSWORD" >/dev/null 2>&1; then
    break
  fi
  echo "  not ready yet ($i/30)..." >&2
  i=$((i+1))
  sleep 2
done

# thử lại lần cuối nếu vẫn fail
mc alias set local "$MINIO_ENDPOINT" "$MINIO_USER" "$MINIO_PASSWORD"

echo "✅ Create bucket: $BUCKET (if not exists)"
mc mb -p "local/$BUCKET" || true

if [ "$PUBLIC_DOWNLOAD" = "true" ]; then
  echo "🌐 Set bucket public download"
  mc anonymous set download "local/$BUCKET" || true
fi

echo "📦 Upload seed data: $SEED_DIR -> local/$BUCKET"
mc mirror --overwrite "$SEED_DIR" "local/$BUCKET"

echo "✅ Done. Listing:"
mc ls -r "local/$BUCKET" || true
