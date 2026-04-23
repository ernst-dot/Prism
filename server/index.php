<?php
/**
 * Prism API — entry point
 * PHP 8.2+
 * Usage: php -S localhost:8000 index.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

// ── CORS ──────────────────────────────────────────────────────
$origin = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Parse request ─────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$parts  = explode('/', ltrim($uri, '/'));  // ['api', 'tasks', '5']

// ── Router ────────────────────────────────────────────────────
// All routes live under /api/...
if (($parts[0] ?? '') !== 'api') {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

$resource = $parts[1] ?? '';
$id       = $parts[2] ?? null;
$sub      = $parts[3] ?? null;

// Load route handler
$routeMap = [
    'auth'       => 'auth',
    'tasks'      => 'tasks',
    'subtasks'   => 'subtasks',
    'habits'     => 'habits',
    'xp'         => 'xp',
    'sleep'      => 'sleep',
    'workouts'   => 'workouts',
    'books'      => 'books',
    'bills'      => 'bills',
    'okrs'       => 'okrs',
    'goals'      => 'goals',
    'challenges' => 'challenges',
    'inbox'      => 'inbox',
    'messages'   => 'messages',
    'journals'   => 'journals',
    'notes'      => 'notes',
    'photos'     => 'photos',
    'users'      => 'users',
    'prefs'      => 'preferences',
];

if (!isset($routeMap[$resource])) {
    http_response_code(404);
    echo json_encode(['error' => "Unknown resource: {$resource}"]);
    exit;
}

$handlerFile = __DIR__ . "/api/{$routeMap[$resource]}.php";

if (!file_exists($handlerFile)) {
    http_response_code(501);
    echo json_encode(['error' => "Handler not implemented yet: {$resource}"]);
    exit;
}

// Pass parsed route info to handlers
$GLOBALS['route'] = compact('method', 'resource', 'id', 'sub', 'parts');

require $handlerFile;
