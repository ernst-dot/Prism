<?php
declare(strict_types=1);
/**
 * POST /api/auth/register  — create account
 * POST /api/auth/login     — get JWT
 * GET  /api/auth/me        — current user (requires token)
 * POST /api/auth/logout    — invalidate token (client-side)
 */

$sub = $GLOBALS['route']['sub'] ?? ($GLOBALS['route']['id'] ?? '');

match ([$GLOBALS['route']['method'], $sub]) {
    ['POST', 'register'] => handleRegister(),
    ['POST', 'login']    => handleLogin(),
    ['GET',  'me']       => handleMe(),
    ['POST', 'logout']   => respond(['ok' => true]),
    default              => respondError('Unknown auth endpoint', 404),
};

// ── Register ──────────────────────────────────────────────────
function handleRegister(): never {
    $b = body();
    required($b, ['username', 'email', 'password']);

    $username = sanitize($b['username'], 40);
    $email    = filter_var(trim($b['email']), FILTER_VALIDATE_EMAIL);
    $password = $b['password'];

    if (!$email)               respondError('Invalid email address', 422);
    if (strlen($password) < 8) respondError('Password must be at least 8 characters', 422);
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        respondError('Username may only contain letters, numbers and underscores', 422);
    }

    $pdo = db();

    // Check uniqueness
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) respondError('Username or email already taken', 409);

    // Insert
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$username, $email, $hash]);
    $userId = (int)$pdo->lastInsertId();

    $token = signJWT(['sub' => $userId, 'username' => $username]);

    respond([
        'token' => $token,
        'user'  => ['id' => $userId, 'username' => $username, 'email' => $email, 'xp' => 0, 'level' => 1, 'streak' => 0],
    ], 201);
}

// ── Login ─────────────────────────────────────────────────────
function handleLogin(): never {
    $b = body();
    required($b, ['email', 'password']);

    $email = trim($b['email']);
    $pdo   = db();

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($b['password'], $user['password'])) {
        respondError('Invalid email or password', 401);
    }

    // Update last_active
    $pdo->prepare('UPDATE users SET last_active = CURDATE() WHERE id = ?')->execute([$user['id']]);

    $token = signJWT(['sub' => (int)$user['id'], 'username' => $user['username']]);

    respond([
        'token' => $token,
        'user'  => [
            'id'       => (int)$user['id'],
            'username' => $user['username'],
            'email'    => $user['email'],
            'xp'       => (int)$user['xp'],
            'level'    => (int)$user['level'],
            'streak'   => (int)$user['streak'],
        ],
    ]);
}

// ── Me ────────────────────────────────────────────────────────
function handleMe(): never {
    $auth = requireAuth();
    $stmt = db()->prepare('SELECT id, username, email, xp, level, streak, avatar_url, created_at FROM users WHERE id = ?');
    $stmt->execute([$auth['sub']]);
    $user = $stmt->fetch();
    if (!$user) respondError('User not found', 404);
    respond($user);
}
