#!/bin/bash

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if php -r "
        try {
            \$pdo = new PDO('mysql:host=${DB_HOST};dbname=${DB_NAME}', '${DB_USER}', '${DB_PASSWORD}');
            exit(0);
        } catch (Exception \$e) {
            exit(1);
        }
    " 2>/dev/null; then
        echo "MySQL is ready!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for MySQL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: MySQL did not become ready in time"
    exit 1
fi

# Wait a bit more for tables to be created by init scripts
echo "Waiting for database initialization..."
sleep 10

# Run the import script
echo "Starting exam import..."
cd /app && php scripts/import_exams_v2.php

echo "Exam import completed!"
