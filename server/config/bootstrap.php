<?php
declare(strict_types=1);

// ── Load .env ─────────────────────────────────────────────────
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $val] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($val);
        putenv(trim($key) . '=' . trim($val));
    }
}

// ── Helpers ───────────────────────────────────────────────────
function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function respondError(string $message, int $status = 400): never {
    respond(['error' => $message], $status);
}

function body(): array {
    static $parsed = null;
    if ($parsed === null) {
        $raw    = file_get_contents('php://input');
        $parsed = json_decode($raw ?: '{}', true) ?? [];
    }
    return $parsed;
}

function requireAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        respondError('Unauthorised — missing token', 401);
    }
    $token = substr($header, 7);
    $user  = verifyJWT($token);
    if (!$user) {
        respondError('Unauthorised — invalid token', 401);
    }
    return $user;
}

// ── JWT (pure PHP, no library needed) ─────────────────────────
function signJWT(array $payload): string {
    $secret  = $_ENV['JWT_SECRET'] ?? 'dev-secret';
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] ??= time() + (int)($_ENV['JWT_EXPIRY'] ?? 604800);
    $body    = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));
    return "{$header}.{$body}.{$sig}";
}

function verifyJWT(string $token): array|false {
    $secret = $_ENV['JWT_SECRET'] ?? 'dev-secret';
    $parts  = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $body, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));
    if (!hash_equals($expected, $sig)) return false;
    $payload = json_decode(base64url_decode($body), true);
    if (($payload['exp'] ?? 0) < time()) return false;
    return $payload;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ── MySQL (PDO singleton) ──────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $_ENV['DB_HOST'] ?? '127.0.0.1',
            $_ENV['DB_PORT'] ?? '3306',
            $_ENV['DB_NAME'] ?? 'prism'
        );
        $pdo = new PDO($dsn, $_ENV['DB_USER'] ?? 'root', $_ENV['DB_PASS'] ?? '', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

// ── MongoDB (ext-mongodb) ─────────────────────────────────────
function mongo(): MongoDB\Database {
    static $mdb = null;
    if ($mdb === null) {
        $client = new MongoDB\Client($_ENV['MONGO_URI'] ?? 'mongodb://localhost:27017');
        $mdb    = $client->selectDatabase($_ENV['MONGO_DB'] ?? 'prism');
    }
    return $mdb;
}

// ── Validation helpers ─────────────────────────────────────────
function required(array $data, array $fields): void {
    foreach ($fields as $f) {
        if (!isset($data[$f]) || $data[$f] === '') {
            respondError("Missing required field: {$f}", 422);
        }
    }
}

function sanitize(string $str, int $max = 500): string {
    return mb_substr(trim(strip_tags($str)), 0, $max);
}
