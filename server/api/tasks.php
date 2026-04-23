<?php
declare(strict_types=1);
/**
 * GET    /api/tasks          — list all tasks for user
 * POST   /api/tasks          — create task
 * PUT    /api/tasks/:id      — full update
 * PATCH  /api/tasks/:id      — partial update (e.g. toggle done)
 * DELETE /api/tasks/:id      — delete
 * PATCH  /api/tasks/reorder  — update positions after drag
 */

$auth   = requireAuth();
$userId = (int)$auth['sub'];
['method' => $method, 'id' => $id] = $GLOBALS['route'];

match (true) {
    $method === 'GET'    && $id === null       => listTasks($userId),
    $method === 'POST'   && $id === null       => createTask($userId),
    $method === 'PUT'    && $id !== null        => updateTask($userId, (int)$id),
    $method === 'PATCH'  && $id === 'reorder'  => reorderTasks($userId),
    $method === 'PATCH'  && $id !== null        => patchTask($userId, (int)$id),
    $method === 'DELETE' && $id !== null        => deleteTask($userId, (int)$id),
    default                                    => respondError('Method not allowed', 405),
};

// ── List ──────────────────────────────────────────────────────
function listTasks(int $userId): never {
    $pdo  = db();
    $done = $_GET['done'] ?? null;

    $sql  = 'SELECT t.*, GROUP_CONCAT(tg.name ORDER BY tg.name SEPARATOR ",") AS tag_names
             FROM tasks t
             LEFT JOIN task_tags tt ON tt.task_id = t.id
             LEFT JOIN tags tg ON tg.id = tt.tag_id
             WHERE t.user_id = ?';
    $args = [$userId];

    if ($done !== null) { $sql .= ' AND t.done = ?'; $args[] = (int)$done; }
    $sql .= ' GROUP BY t.id ORDER BY t.position ASC, t.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    $tasks = $stmt->fetchAll();

    // Hydrate subtasks
    if ($tasks) {
        $ids      = array_column($tasks, 'id');
        $in       = implode(',', array_fill(0, count($ids), '?'));
        $subStmt  = $pdo->prepare("SELECT * FROM subtasks WHERE task_id IN ({$in}) ORDER BY position");
        $subStmt->execute($ids);
        $subs     = $subStmt->fetchAll();
        $subMap   = [];
        foreach ($subs as $s) $subMap[$s['task_id']][] = $s;
        foreach ($tasks as &$t) {
            $t['subtasks']  = $subMap[$t['id']] ?? [];
            $t['tags']      = $t['tag_names'] ? explode(',', $t['tag_names']) : [];
            $t['done']      = (bool)$t['done'];
            unset($t['tag_names']);
        }
    }

    respond($tasks);
}

// ── Create ────────────────────────────────────────────────────
function createTask(int $userId): never {
    $b = body();
    required($b, ['text']);

    $pdo  = db();
    $stmt = $pdo->prepare('INSERT INTO tasks
        (user_id, text, priority, due_date, recurring, notes, position)
        VALUES (?, ?, ?, ?, ?, ?, 0)');
    $stmt->execute([
        $userId,
        sanitize($b['text']),
        $b['priority'] ?? '',
        $b['due_date'] ?: null,
        $b['recurring'] ?? '',
        sanitize($b['notes'] ?? '', 5000),
    ]);
    $taskId = (int)$pdo->lastInsertId();

    // Insert tags
    if (!empty($b['tags'])) {
        insertTags($pdo, $userId, $taskId, (array)$b['tags']);
    }

    $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();
    $task['subtasks'] = [];
    $task['tags']     = $b['tags'] ?? [];
    $task['done']     = false;

    respond($task, 201);
}

// ── Full update ───────────────────────────────────────────────
function updateTask(int $userId, int $taskId): never {
    ownsTask($userId, $taskId);
    $b   = body();
    $pdo = db();

    $pdo->prepare('UPDATE tasks SET
        text=?, priority=?, due_date=?, recurring=?, notes=?,
        done=?, done_at=?, delegated_to=?, location=?
        WHERE id = ? AND user_id = ?')->execute([
        sanitize($b['text'] ?? '', 500),
        $b['priority'] ?? '',
        $b['due_date'] ?: null,
        $b['recurring'] ?? '',
        sanitize($b['notes'] ?? '', 5000),
        (int)($b['done'] ?? 0),
        $b['done'] ? date('Y-m-d H:i:s') : null,
        $b['delegated_to'] ?? null,
        $b['location'] ?? null,
        $taskId,
        $userId,
    ]);

    // Replace tags
    $pdo->prepare('DELETE FROM task_tags WHERE task_id = ?')->execute([$taskId]);
    if (!empty($b['tags'])) insertTags($pdo, $userId, $taskId, (array)$b['tags']);

    // Replace subtasks
    if (isset($b['subtasks'])) {
        $pdo->prepare('DELETE FROM subtasks WHERE task_id = ?')->execute([$taskId]);
        foreach ((array)$b['subtasks'] as $i => $s) {
            $pdo->prepare('INSERT INTO subtasks (task_id, text, done, position) VALUES (?,?,?,?)')
                ->execute([$taskId, sanitize($s['text'] ?? '', 300), (int)($s['done'] ?? 0), $i]);
        }
    }

    respond(['ok' => true]);
}

// ── Patch (partial update) ────────────────────────────────────
function patchTask(int $userId, int $taskId): never {
    ownsTask($userId, $taskId);
    $b    = body();
    $pdo  = db();
    $sets = []; $args = [];

    $allowed = ['text', 'priority', 'due_date', 'done', 'recurring', 'notes', 'delegated_to', 'location'];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $b)) {
            $sets[] = "{$col} = ?";
            $args[] = $col === 'text' ? sanitize($b[$col]) : ($b[$col] === '' ? null : $b[$col]);
        }
    }
    if (isset($b['done']) && $b['done']) { $sets[] = 'done_at = NOW()'; }
    if (!$sets) respond(['ok' => true]);

    $args[] = $taskId; $args[] = $userId;
    $pdo->prepare('UPDATE tasks SET ' . implode(', ', $sets) . ' WHERE id = ? AND user_id = ?')
        ->execute($args);

    respond(['ok' => true]);
}

// ── Delete ────────────────────────────────────────────────────
function deleteTask(int $userId, int $taskId): never {
    ownsTask($userId, $taskId);
    db()->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')->execute([$taskId, $userId]);
    respond(['ok' => true]);
}

// ── Reorder ───────────────────────────────────────────────────
function reorderTasks(int $userId): never {
    $b   = body();
    $ids = $b['ids'] ?? [];
    $pdo = db();
    $stmt = $pdo->prepare('UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?');
    foreach ($ids as $pos => $id) $stmt->execute([$pos, (int)$id, $userId]);
    respond(['ok' => true]);
}

// ── Helpers ───────────────────────────────────────────────────
function ownsTask(int $userId, int $taskId): void {
    $stmt = db()->prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ? LIMIT 1');
    $stmt->execute([$taskId, $userId]);
    if (!$stmt->fetch()) respondError('Task not found', 404);
}

function insertTags(PDO $pdo, int $userId, int $taskId, array $tagNames): void {
    foreach ($tagNames as $name) {
        $name = sanitize($name, 50);
        if (!$name) continue;
        // Upsert tag
        $pdo->prepare('INSERT IGNORE INTO tags (user_id, name) VALUES (?, ?)')->execute([$userId, $name]);
        $stmt = $pdo->prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?');
        $stmt->execute([$userId, $name]);
        $tagId = $stmt->fetchColumn();
        $pdo->prepare('INSERT IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)')->execute([$taskId, $tagId]);
    }
}
