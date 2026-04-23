<?php
namespace Prism\Controllers;

use MongoDB\Client as MongoClient;
use PDO;

abstract class BaseController
{
    public function __construct(
        protected PDO $db,
        protected MongoClient $mongo,
        protected ?array $user = null
    ) {}

    // ── Response helpers ──────────────────────
    protected function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    protected function success(mixed $data = null, string $message = 'OK'): void
    {
        $this->json(['success' => true, 'message' => $message, 'data' => $data]);
    }

    protected function error(string $message, int $status = 400): void
    {
        $this->json(['success' => false, 'error' => $message], $status);
    }

    protected function userId(): int
    {
        return (int) ($this->user['id'] ?? 0);
    }

    // ── MongoDB collection shortcut ───────────
    protected function collection(string $name)
    {
        return $this->mongo->prism->$name;
    }
}
