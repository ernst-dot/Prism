FROM php:8.2-apache

RUN a2dismod mpm_event mpm_worker mpm_prefork 2>/dev/null || true \ 
    && a2enmod mpm_prefork rewrite headers

RUN apt-get update && apt-get install -y libpng-dev libzip-dev libssl-dev pkg-config && docker-php-ext-install pdo pdo_mysql zip && pecl install mongodb redis && docker-php-ext-enable mongodb redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN echo "<Directory /var/www/html>\nAllowOverride All\nRequire all granted\nHeader always set Access-Control-Allow-Origin \"*\"\nHeader always set Access-Control-Allow-Methods \"GET, POST, PUT, PATCH, DELETE, OPTIONS\"\nHeader always set Access-Control-Allow-Headers \"Content-Type, Authorization\"\nSetEnvIf Authorization \"(.*)\" HTTP_AUTHORIZATION=$1\n</Directory>" > /etc/apache2/conf-enabled/prism.conf

WORKDIR /var/www/html
COPY composer.json .
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs 2>/dev/null || true
COPY . .
RUN mkdir -p src/Middleware src/Controllers src/Config && cp middleware/Auth.php src/Middleware/Auth.php && cp middleware/Cors.php src/Middleware/Cors.php && cp config/Database.php src/Config/Database.php && cp api/BaseController.php src/Controllers/BaseController.php && cp api/AuthController.php src/Controllers/AuthController.php && cp api/TaskController.php src/Controllers/TaskController.php && cp api/JournalController.php src/Controllers/JournalController.php && cp api/InsightsController.php src/Controllers/InsightsController.php && composer dump-autoload --optimize --ignore-platform-reqs 2>/dev/null || true

EXPOSE 80
