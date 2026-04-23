<?php
namespace Prism\Controllers;

use Prism\Middleware\Auth;

class AuthController extends BaseController
{
    public function register(array $params, array $body): void
    {
        $username = trim($body['username'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$username || !$email || !$password) {
            $this->error('username, email and password are required');
            return;
        }
        if (strlen($username) < 3 || strlen($username) > 50) {
            $this->error('username must be 3–50 characters');
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('invalid email address');
            return;
        }
        if (strlen($password) < 8) {
            $this->error('password must be at least 8 characters');
            return;
        }

        // Check duplicate
        $check = $this->db->prepare('SELECT id FROM users WHERE username=? OR email=?');
        $check->execute([$username, $email]);
        if ($check->fetch()) {
            $this->error('username or email already taken', 409);
            return;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $this->db->prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        );
        $stmt->execute([$username, $email, $hash]);
        $id = (int) $this->db->lastInsertId();

        $user   = ['id' => $id, 'username' => $username, 'email' => $email];
        $token  = Auth::generateToken($user);

        $this->json(['token' => $token, 'user' => $user], 201);
    }

    public function login(array $params, array $body): void
    {
        $login    = trim($body['login'] ?? '');     // username or email
        $password = $body['password'] ?? '';

        if (!$login || !$password) {
            $this->error('login and password are required');
            return;
        }

        $stmt = $this->db->prepare(
            'SELECT id, username, email, password, xp, level, streak FROM users
             WHERE username=? OR email=? LIMIT 1'
        );
        $stmt->execute([$login, $login]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            $this->error('invalid credentials', 401);
            return;
        }

        // Update last_active
        $this->db->prepare('UPDATE users SET last_active=CURDATE() WHERE id=?')
                 ->execute([$user['id']]);

        unset($user['password']);
        $token = Auth::generateToken($user);
        $this->json(['token' => $token, 'user' => $user]);
    }

    public function me(array $params, array $body): void
    {
        $stmt = $this->db->prepare(
            'SELECT id, username, email, xp, level, streak, avatar_url, created_at
             FROM users WHERE id=?'
        );
        $stmt->execute([$this->userId()]);
        $user = $stmt->fetch();
        if (!$user) { $this->error('user not found', 404); return; }
        $this->json($user);
    }

    public function updateProfile(array $params, array $body): void
    {
        $allowed = ['username', 'email', 'avatar_url'];
        $updates = [];
        $values  = [];

        foreach ($allowed as $field) {
            if (isset($body[$field])) {
                $updates[] = "{$field}=?";
                $values[]  = $body[$field];
            }
        }

        if (isset($body['password'])) {
            if (strlen($body['password']) < 8) {
                $this->error('password must be at least 8 characters');
                return;
            }
            $updates[] = 'password=?';
            $values[]  = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (empty($updates)) { $this->error('nothing to update'); return; }

        $values[] = $this->userId();
        $this->db->prepare('UPDATE users SET ' . implode(',', $updates) . ' WHERE id=?')
                 ->execute($values);

        $this->success(null, 'Profile updated');
    }

    public function refresh(array $params, array $body): void
    {
        // User is already authenticated via middleware
        $token = Auth::generateToken($this->user);
        $this->json(['token' => $token]);
    }
}
