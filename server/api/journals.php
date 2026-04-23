<?php
declare(strict_types=1);
/**
 * GET    /api/journals          — list journal entries (recent first)
 * POST   /api/journals          — create entry
 * GET    /api/journals/:id      — single entry
 * PUT    /api/journals/:id      — update entry
 * DELETE /api/journals/:id      — delete entry
 */

$auth   = requireAuth();
$userId = (int)$auth['sub'];
['method' => $method, 'id' => $id] = $GLOBALS['route'];

match (true) {
    $method === 'GET'    && $id === null  => listJournals($userId),
    $method === 'POST'   && $id === null  => createJournal($userId),
    $method === 'GET'    && $id !== null  => getJournal($userId, $id),
    $method === 'PUT'    && $id !== null  => updateJournal($userId, $id),
    $method === 'DELETE' && $id !== null  => deleteJournal($userId, $id),
    default                              => respondError('Method not allowed', 405),
};

function listJournals(int $userId): never {
    $col     = mongo()->selectCollection('journals');
    $limit   = min((int)($_GET['limit'] ?? 30), 100);
    $cursor  = $col->find(
        ['user_id' => $userId],
        ['sort' => ['date' => -1], 'limit' => $limit, 'projection' => ['_id' => 1, 'date' => 1, 'mood' => 1, 'text' => 1]]
    );
    $entries = [];
    foreach ($cursor as $doc) {
        $entries[] = [
            'id'   => (string)$doc['_id'],
            'date' => $doc['date'],
            'mood' => $doc['mood'] ?? null,
            'text' => mb_substr($doc['text'] ?? '', 0, 200), // preview only
        ];
    }
    respond($entries);
}

function createJournal(int $userId): never {
    $b = body();
    required($b, ['text']);

    $col = mongo()->selectCollection('journals');
    $result = $col->insertOne([
        'user_id'    => $userId,
        'date'       => $b['date'] ?? date('Y-m-d'),
        'mood'       => $b['mood'] ?? null,
        'text'       => sanitize($b['text'], 10000),
        'prompt'     => $b['prompt'] ?? null,
        'tags'       => $b['tags'] ?? [],
        'xp_awarded' => 5,
        'created_at' => new MongoDB\BSON\UTCDateTime(),
    ]);

    // Award XP in MySQL
    db()->prepare('UPDATE users SET xp = xp + 5 WHERE id = ?')->execute([$userId]);
    db()->prepare('INSERT INTO xp_events (user_id, amount, reason) VALUES (?,5,"journal")')->execute([$userId]);

    respond(['id' => (string)$result->getInsertedId()], 201);
}

function getJournal(int $userId, string $id): never {
    $col = mongo()->selectCollection('journals');
    $doc = $col->findOne(['_id' => new MongoDB\BSON\ObjectId($id), 'user_id' => $userId]);
    if (!$doc) respondError('Not found', 404);
    respond([
        'id'      => (string)$doc['_id'],
        'date'    => $doc['date'],
        'mood'    => $doc['mood'] ?? null,
        'text'    => $doc['text'] ?? '',
        'prompt'  => $doc['prompt'] ?? null,
        'tags'    => (array)($doc['tags'] ?? []),
    ]);
}

function updateJournal(int $userId, string $id): never {
    $b   = body();
    $col = mongo()->selectCollection('journals');
    $col->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($id), 'user_id' => $userId],
        ['$set' => array_filter([
            'text'  => isset($b['text']) ? sanitize($b['text'], 10000) : null,
            'mood'  => $b['mood'] ?? null,
            'tags'  => $b['tags'] ?? null,
        ])]
    );
    respond(['ok' => true]);
}

function deleteJournal(int $userId, string $id): never {
    mongo()->selectCollection('journals')->deleteOne([
        '_id'     => new MongoDB\BSON\ObjectId($id),
        'user_id' => $userId,
    ]);
    respond(['ok' => true]);
}
