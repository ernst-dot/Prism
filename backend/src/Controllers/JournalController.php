<?php
namespace Prism\Controllers;

use MongoDB\BSON\UTCDateTime;

class JournalController extends BaseController
{
    private function col() { return $this->collection('journals'); }

    public function save(array $params, array $body): void
    {
        $text = trim($body['text'] ?? '');
        $date = $body['date'] ?? date('Y-m-d');
        $mood = $body['mood'] ?? null;
        $tags = $body['tags'] ?? [];

        if (!$text) { $this->error('text is required'); return; }

        // Upsert by user+date
        $this->col()->updateOne(
            ['user_id' => $this->userId(), 'date' => $date],
            ['$set' => [
                'text'       => $text,
                'mood'       => $mood,
                'tags'       => $tags,
                'word_count' => str_word_count($text),
                'updated_at' => new UTCDateTime(),
            ],
             '$setOnInsert' => [
                'created_at' => new UTCDateTime(),
             ]],
            ['upsert' => true]
        );

        // Award XP for first entry today
        $xp = $this->db->prepare(
            'SELECT id FROM xp_events WHERE user_id=? AND source="journal"
             AND DATE(created_at)=CURDATE()'
        );
        $xp->execute([$this->userId()]);
        if (!$xp->fetch()) {
            $this->db->prepare(
                'INSERT INTO xp_events (user_id, amount, source) VALUES (?, 5, "journal")'
            )->execute([$this->userId()]);
            $this->db->prepare('UPDATE users SET xp=xp+5 WHERE id=?')
                     ->execute([$this->userId()]);
        }

        $this->success(null, 'Journal saved');
    }

    public function get(array $params, array $body): void
    {
        $entry = $this->col()->findOne([
            'user_id' => $this->userId(),
            'date'    => $params['date'],
        ]);
        if (!$entry) { $this->error('entry not found', 404); return; }
        $this->json($this->toArray($entry));
    }

    public function list(array $params, array $body): void
    {
        $limit  = min((int) ($_GET['limit'] ?? 30), 100);
        $cursor = $this->col()->find(
            ['user_id' => $this->userId()],
            ['sort' => ['date' => -1], 'limit' => $limit,
             'projection' => ['text' => 1, 'date' => 1, 'mood' => 1, 'word_count' => 1]]
        );
        $this->json(array_map([$this, 'toArray'], iterator_to_array($cursor)));
    }

    private function toArray($doc): array
    {
        $arr = (array) $doc;
        unset($arr['_id']);
        return $arr;
    }
}
