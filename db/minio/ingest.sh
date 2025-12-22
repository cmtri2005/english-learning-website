#!/bin/sh
set -eu

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minioalt:9000}"
MINIO_USER="${MINIO_USER:-minioadmin}"
MINIO_PASSWORD="${MINIO_PASSWORD:-minioadmin123}"
BUCKET="${BUCKET:-my-bucket}"
SEED_DIR="${SEED_DIR:-/seed}"
PUBLIC_DOWNLOAD="${PUBLIC_DOWNLOAD:-false}"
PROCESS_DICTIONARY="${PROCESS_DICTIONARY:-false}"

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

# Final retry if still failing
mc alias set local "$MINIO_ENDPOINT" "$MINIO_USER" "$MINIO_PASSWORD"

echo "✅ Create bucket: $BUCKET (if not exists)"
mc mb -p "local/$BUCKET" || true

if [ "$PUBLIC_DOWNLOAD" = "true" ]; then
  echo "🌐 Set bucket public download"
  mc anonymous set download "local/$BUCKET" || true
fi

echo "📦 Upload seed data: $SEED_DIR -> local/$BUCKET"
# Mirror all files except dictionary source (will be processed separately)
mc mirror --overwrite --exclude "SPDict-Anh-Viet-Anh.dictd/*" "$SEED_DIR" "local/$BUCKET"

# Process dictionary data if enabled
if [ "$PROCESS_DICTIONARY" = "true" ]; then
  DICT_DIR="$SEED_DIR/SPDict-Anh-Viet-Anh.dictd"
  if [ -d "$DICT_DIR" ]; then
    echo "📚 Processing dictionary data..."
    export MINIO_ENDPOINT="$MINIO_ENDPOINT"
    export MINIO_ACCESS_KEY="$MINIO_USER"
    export MINIO_SECRET_KEY="$MINIO_PASSWORD"
    export MINIO_BUCKET="$BUCKET"
    export DICT_DIR="$DICT_DIR"
    python /ingest_dictionary.py || echo "⚠️ Dictionary processing failed (non-critical)"
  else
    echo "⚠️ Dictionary directory not found, skipping..."
  fi
fi

echo "✅ Done. Listing:"
mc ls -r "local/$BUCKET" | head -50 || true
echo "... (showing first 50 items)"
