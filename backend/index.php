<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Prism\Config\Database;
use Prism\Middleware\Auth;
use Prism\Middleware\Cors;

// ── Bootstrap ──────────────────────────────────
Cors::handle();           // sets CORS headers + handles OPTIONS preflight
header('Content-Type: application/json; charset=utf-8');

// ── Parse request ──────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = '/' . trim($uri, '/');

// Strip /api prefix if present
$uri = preg_replace('#^/api#', '', $uri) ?: '/';

// ── Route map ──────────────────────────────────
$routes = [
    'POST'   => [
        '/auth/register'          => ['Prism\Controllers\AuthController', 'register'],
        '/auth/login'             => ['Prism\Controllers\AuthController', 'login'],
        '/auth/refresh'           => ['Prism\Controllers\AuthController', 'refresh'],
        '/tasks'                  => ['Prism\Controllers\TaskController', 'create'],
        '/tasks/{id}/subtasks'    => ['Prism\Controllers\TaskController', 'addSubtask'],
        '/habits'                 => ['Prism\Controllers\HabitController', 'create'],
        '/habits/{id}/log'        => ['Prism\Controllers\HabitController', 'log'],
        '/sleep'                  => ['Prism\Controllers\SleepController', 'log'],
        '/workouts'               => ['Prism\Controllers\WorkoutController', 'log'],
        '/journal'                => ['Prism\Controllers\JournalController', 'save'],
        '/notes'                  => ['Prism\Controllers\NoteController', 'create'],
        '/calendar'               => ['Prism\Controllers\CalendarController', 'create'],
        '/books'                  => ['Prism\Controllers\BookController', 'create'],
        '/challenges'             => ['Prism\Controllers\ChallengeController', 'create'],
        '/messages'               => ['Prism\Controllers\MessageController', 'send'],
        '/xp'                     => ['Prism\Controllers\XpController', 'award'],
    ],
    'GET'    => [
        '/health'                 => ['Prism\Controllers\HealthController', 'check'],
        '/me'                     => ['Prism\Controllers\AuthController', 'me'],
        '/tasks'                  => ['Prism\Controllers\TaskController', 'list'],
        '/tasks/{id}'             => ['Prism\Controllers\TaskController', 'get'],
        '/habits'                 => ['Prism\Controllers\HabitController', 'list'],
        '/sleep'                  => ['Prism\Controllers\SleepController', 'list'],
        '/workouts'               => ['Prism\Controllers\WorkoutController', 'list'],
        '/journal'                => ['Prism\Controllers\JournalController', 'list'],
        '/journal/{date}'         => ['Prism\Controllers\JournalController', 'get'],
        '/notes'                  => ['Prism\Controllers\NoteController', 'list'],
        '/calendar'               => ['Prism\Controllers\CalendarController', 'list'],
        '/books'                  => ['Prism\Controllers\BookController', 'list'],
        '/challenges'             => ['Prism\Controllers\ChallengeController', 'list'],
        '/leaderboard'            => ['Prism\Controllers\XpController', 'leaderboard'],
        '/messages/{room}'        => ['Prism\Controllers\MessageController', 'list'],
        '/insights'               => ['Prism\Controllers\InsightsController', 'weekly'],
    ],
    'PATCH'  => [
        '/tasks/{id}'             => ['Prism\Controllers\TaskController', 'update'],
        '/tasks/{id}/toggle'      => ['Prism\Controllers\TaskController', 'toggle'],
        '/habits/{id}'            => ['Prism\Controllers\HabitController', 'update'],
        '/books/{id}'             => ['Prism\Controllers\BookController', 'update'],
        '/me'                     => ['Prism\Controllers\AuthController', 'updateProfile'],
    ],
    'DELETE' => [
        '/tasks/{id}'             => ['Prism\Controllers\TaskController', 'delete'],
        '/habits/{id}'            => ['Prism\Controllers\HabitController', 'delete'],
        '/calendar/{id}'          => ['Prism\Controllers\CalendarController', 'delete'],
        '/books/{id}'             => ['Prism\Controllers\BookController', 'delete'],
        '/notes/{id}'             => ['Prism\Controllers\NoteController', 'delete'],
    ],
];

// ── Match route ────────────────────────────────
$params = [];
$handler = null;

if (isset($routes[$method])) {
    foreach ($routes[$method] as $pattern => $h) {
        $regex = preg_replace('#\{[^}]+\}#', '([^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';
        if (preg_match($regex, $uri, $m)) {
            array_shift($m);
            // Map {id}, {date}, {room} etc. to named params
            preg_match_all('#\{([^}]+)\}#', $pattern, $names);
            $params = array_combine($names[1], $m) ?: [];
            $handler = $h;
            break;
        }
    }
}

if (!$handler) {
    http_response_code(404);
    echo json_encode(['error' => 'Route not found', 'path' => $uri, 'method' => $method]);
    exit;
}

// ── Auth middleware (skip public routes) ───────
$publicRoutes = ['/auth/register', '/auth/login', '/health'];
if (!in_array($uri, $publicRoutes)) {
    $user = Auth::requireUser();
    if (!$user) exit;   // Auth::requireUser sends 401 and exits
}

// ── Dispatch ───────────────────────────────────
[$class, $action] = $handler;
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$controller = new $class(Database::mysql(), Database::mongo(), $user ?? null);
$controller->$action($params, $body);
