<?php
namespace Prism\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class Auth
{
    public static function requireUser(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'No token provided']);
            exit;
        }

        $token = substr($header, 7);
        try {
            $decoded = JWT::decode($token, new Key(
                getenv('JWT_SECRET') ?: 'fallback_secret',
                'HS256'
            ));
            return (array) $decoded->user;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }
    }

    public static function generateToken(array $user): string
    {
        $payload = [
            'iat'  => time(),
            'exp'  => time() + (60 * 60 * 24 * 7), // 7 days
            'user' => [
                'id'       => $user['id'],
                'username' => $user['username'],
                'email'    => $user['email'],
            ],
        ];
        return JWT::encode($payload, getenv('JWT_SECRET') ?: 'fallback_secret', 'HS256');
    }
}
