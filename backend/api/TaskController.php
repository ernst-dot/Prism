<?php
namespace Prism\Controllers;

class TaskController extends BaseController
{
    public function list(array $params, array $body): void
    {
        $uid    = $this->userId();
        $filter = $_GET['filter'] ?? 'all';
        $tag    = $_GET['tag']    ?? '';
        $q      = $_GET['q']      ?? '';

        $sql    = 'SELECT t.*, GROUP_CONCAT(tt.tag) as tags_csv
                   FROM tasks t
                   LEFT JOIN task_tags tt ON tt.task_id = t.id
                   WHERE t.user_id = ?';
        $args   = [$uid];

        if ($filter === 'active')   { $sql .= ' AND t.done = 0'; }
        if ($filter === 'done')     { $sql .= ' AND t.done = 1'; }
        if ($filter === 'high')     { $sql .= ' AND t.priority = "high"'; }
        if ($filter === 'today')    { $sql .= ' AND t.due_date = CURDATE()'; }
        if ($filter === 'overdue')  { $sql .= ' AND t.due_date < CURDATE() AND t.done = 0'; }
        if ($tag)  { $sql .= ' AND t.id IN (SELECT task_id FROM task_tags WHERE tag = ?)'; $args[] = $tag; }
        if ($q)    { $sql .= ' AND t.text LIKE ?'; $args[] = "%{$q}%"; }

        $sql .= ' GROUP BY t.id ORDER BY t.done ASC, t.due_date ASC, t.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        $tasks = $stmt->fetchAll();

        // Attach subtasks + format tags
        foreach ($tasks as &$task) {
            $task['tags'] = $task['tags_csv'] ? explode(',', $task['tags_csv']) : [];
            unset($task['tags_csv']);
            $task['done']   = (bool) $task['done'];
            $task['locked'] = (bool) $task['locked'];

            $sub = $this->db->prepare(
                'SELECT id, text, done, position FROM subtasks WHERE task_id=? ORDER BY position'
            );
            $sub->execute([$task['id']]);
            $task['subtasks'] = $sub->fetchAll();
        }

        $this->json($tasks);
    }

    public function get(array $params, array $body): void
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM tasks WHERE id=? AND user_id=?'
        );
        $stmt->execute([$params['id'], $this->userId()]);
        $task = $stmt->fetch();
        if (!$task) { $this->error('task not found', 404); return; }
        $this->json($task);
    }

    public function create(array $params, array $body): void
    {
        $text = trim($body['text'] ?? '');
        if (!$text) { $this->error('text is required'); return; }

        $stmt = $this->db->prepare(
            'INSERT INTO tasks (user_id, text, priority, due_date, recurring, location)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $this->userId(),
            $text,
            $body['priority']  ?? '',
            $body['due_date']  ?: null,
            $body['recurring'] ?? '',
            $body['location']  ?? null,
        ]);
        $id = (int) $this->db->lastInsertId();

        // Insert tags
        if (!empty($body['tags']) && is_array($body['tags'])) {
            $ins = $this->db->prepare('INSERT IGNORE INTO task_tags (task_id, tag) VALUES (?, ?)');
            foreach ($body['tags'] as $tag) {
                $ins->execute([$id, trim($tag)]);
            }
        }

        $this->json(['id' => $id, 'message' => 'Task created'], 201);
    }

    public function update(array $params, array $body): void
    {
        $allowed = ['text', 'priority', 'due_date', 'recurring', 'location', 'locked'];
        $updates = [];
        $values  = [];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = "{$field}=?";
                $values[]  = $body[$field];
            }
        }

        if (empty($updates)) { $this->error('nothing to update'); return; }

        $values[] = $params['id'];
        $values[] = $this->userId();

        $this->db->prepare(
            'UPDATE tasks SET ' . implode(',', $updates) . ' WHERE id=? AND user_id=?'
        )->execute($values);

        // Replace tags if provided
        if (isset($body['tags']) && is_array($body['tags'])) {
            $this->db->prepare('DELETE FROM task_tags WHERE task_id=?')->execute([$params['id']]);
            $ins = $this->db->prepare('INSERT IGNORE INTO task_tags (task_id, tag) VALUES (?, ?)');
            foreach ($body['tags'] as $tag) {
                $ins->execute([$params['id'], trim($tag)]);
            }
        }

        $this->success(null, 'Task updated');
    }

    public function toggle(array $params, array $body): void
    {
        $stmt = $this->db->prepare(
            'UPDATE tasks SET done = NOT done,
             done_at = CASE WHEN done = 0 THEN NOW() ELSE NULL END
             WHERE id=? AND user_id=?'
        );
        $stmt->execute([$params['id'], $this->userId()]);

        // Award XP when completing
        $task = $this->db->prepare('SELECT done FROM tasks WHERE id=?');
        $task->execute([$params['id']]);
        $row = $task->fetch();
        if ($row && $row['done']) {
            $this->db->prepare(
                'INSERT INTO xp_events (user_id, amount, source) VALUES (?, 20, "task")'
            )->execute([$this->userId()]);
            $this->db->prepare(
                'UPDATE users SET xp = xp + 20 WHERE id=?'
            )->execute([$this->userId()]);
        }

        $this->success(null, 'Task toggled');
    }

    public function delete(array $params, array $body): void
    {
        $this->db->prepare('DELETE FROM tasks WHERE id=? AND user_id=?')
                 ->execute([$params['id'], $this->userId()]);
        $this->success(null, 'Task deleted');
    }

    public function addSubtask(array $params, array $body): void
    {
        $text = trim($body['text'] ?? '');
        if (!$text) { $this->error('text is required'); return; }

        $stmt = $this->db->prepare(
            'INSERT INTO subtasks (task_id, text) VALUES (?, ?)'
        );
        $stmt->execute([$params['id'], $text]);
        $this->json(['id' => $this->db->lastInsertId()], 201);
    }
}
