FROM php:8.2-cli

# Install PDO MySQL extension and bash
RUN apt-get update && apt-get install -y bash \
    && docker-php-ext-install pdo pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the seed script
COPY seed.sh /seed.sh
RUN chmod +x /seed.sh

CMD ["/seed.sh"]
