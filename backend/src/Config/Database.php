<?php
namespace Prism\Config;

use MongoDB\Client as MongoClient;
use PDO;
use PDOException;

class Database
{
    private static ?PDO $mysql = null;
    private static ?MongoClient $mongo = null;

    // ── MySQL (PDO) ────────────────────────────
    public static function mysql(): PDO
    {
        if (self::$mysql) return self::$mysql;

        $host = getenv('MYSQL_HOST') ?: 'mysql';
        $db   = getenv('MYSQL_DB')   ?: 'prism';
        $user = getenv('MYSQL_USER') ?: 'prism';
        $pass = getenv('MYSQL_PASS') ?: 'prism_secret';

        $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
        try {
            self::$mysql = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(503);
            echo json_encode(['error' => 'Database unavailable']);
            exit;
        }

        return self::$mysql;
    }

    // ── MongoDB ────────────────────────────────
    public static function mongo(): MongoClient
    {
        if (self::$mongo) return self::$mongo;

        $uri = getenv('MONGO_URI') ?: 'mongodb://mongo:27017/prism';
        self::$mongo = new MongoClient($uri);
        return self::$mongo;
    }

    // ── Helper: get Mongo DB ───────────────────
    public static function mongoDB(string $db = 'prism')
    {
        return self::mongo()->selectDatabase($db);
    }
}
