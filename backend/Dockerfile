FROM php:8.2-fpm-alpine

RUN apk add --no-cache nginx libpng-dev libzip-dev openssl-dev pkgconfig \
    && docker-php-ext-install pdo pdo_mysql zip \
    && pecl install mongodb redis \
    && docker-php-ext-enable mongodb redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN mkdir -p /etc/nginx/http.d && echo 'server { listen 80; root /var/www/html; index index.php; location / { try_files $uri $uri/ /index.php?$query_string; } location ~ \.php$ { fastcgi_pass 127.0.0.1:9000; fastcgi_index index.php; include fastcgi_params; fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; fastcgi_param HTTP_AUTHORIZATION $http_authorization; } }' > /etc/nginx/http.d/default.conf

WORKDIR /var/www/html
COPY composer.json .
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs 2>/dev/null || true
COPY . .
RUN mkdir -p src/Middleware src/Controllers src/Config && cp middleware/Auth.php src/Middleware/Auth.php && cp middleware/Cors.php src/Middleware/Cors.php && cp config/Database.php src/Config/Database.php && cp api/BaseController.php src/Controllers/BaseController.php && cp api/AuthController.php src/Controllers/AuthController.php && cp api/TaskController.php src/Controllers/TaskController.php && cp api/JournalController.php src/Controllers/JournalController.php && cp api/InsightsController.php src/Controllers/InsightsController.php && composer dump-autoload --optimize --ignore-platform-reqs 2>/dev/null || true

EXPOSE 80
CMD php-fpm -D && nginx -g 'daemon off;'
