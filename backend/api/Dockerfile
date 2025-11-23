# php-api/Dockerfile
FROM php:8.2-apache

# Cài extension để connect MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Bật mod_rewrite cho routing
RUN a2enmod rewrite

# Copy Apache config
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

# Copy toàn bộ code vào container (bao gồm helpers và public)
COPY . /var/www/html

# Set quyền
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
