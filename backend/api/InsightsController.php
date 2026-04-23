<?php
namespace Prism\Controllers;

class InsightsController extends BaseController
{
    public function weekly(array $params, array $body): void
    {
        $uid = $this->userId();

        // Tasks this week
        $tasks = $this->db->prepare(
            'SELECT COUNT(*) as total,
                    SUM(done) as done_count,
                    SUM(CASE WHEN priority="high" AND done=1 THEN 1 ELSE 0 END) as high_done,
                    SUM(CASE WHEN due_date < CURDATE() AND done=0 THEN 1 ELSE 0 END) as overdue
             FROM tasks WHERE user_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        $tasks->execute([$uid]);
        $taskStats = $tasks->fetch();

        // Sleep avg this week
        $sleep = $this->db->prepare(
            'SELECT AVG(hours) as avg_hours, COUNT(*) as nights
             FROM sleep_logs WHERE user_id=? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );
        $sleep->execute([$uid]);
        $sleepStats = $sleep->fetch();

        // Workouts this week
        $workouts = $this->db->prepare(
            'SELECT COUNT(*) as count, SUM(duration) as total_mins
             FROM workouts WHERE user_id=? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );
        $workouts->execute([$uid]);
        $workoutStats = $workouts->fetch();

        // XP this week
        $xp = $this->db->prepare(
            'SELECT SUM(amount) as earned FROM xp_events
             WHERE user_id=? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        $xp->execute([$uid]);
        $xpStats = $xp->fetch();

        // User streak
        $user = $this->db->prepare('SELECT streak, xp, level FROM users WHERE id=?');
        $user->execute([$uid]);
        $userStats = $user->fetch();

        // Build insights
        $insights = [];
        $completion = $taskStats['total'] > 0
            ? ($taskStats['done_count'] / $taskStats['total']) * 100 : 0;

        if ($completion >= 70) {
            $insights[] = ['icon'=>'🔥','text'=>"Incredible week! You completed {$taskStats['done_count']} of {$taskStats['total']} tasks.",'type'=>'success'];
        } elseif ($taskStats['done_count'] < 3) {
            $insights[] = ['icon'=>'💡','text'=>'You have many tasks pending. Try the Focus mode to tackle them one at a time.','type'=>'tip'];
        }
        if ($taskStats['overdue'] > 0) {
            $insights[] = ['icon'=>'⚠️','text'=>"{$taskStats['overdue']} task(s) are overdue. Consider rescheduling or deleting stale ones.",'type'=>'warning'];
        }
        if ($taskStats['high_done'] > 0) {
            $insights[] = ['icon'=>'⭐','text'=>"You completed {$taskStats['high_done']} high-priority task(s) — great prioritisation!",'type'=>'success'];
        }
        $avgSleep = round((float)($sleepStats['avg_hours'] ?? 0), 1);
        if ($avgSleep > 0 && $avgSleep < 7) {
            $insights[] = ['icon'=>'🌙','text'=>"Your average sleep is {$avgSleep}h — below the recommended 7–9h. Try an earlier bedtime.",'type'=>'warning'];
        }
        if (($workoutStats['count'] ?? 0) === 0) {
            $insights[] = ['icon'=>'💪','text'=>'No workouts logged this week. Even a 10-minute walk counts!','type'=>'tip'];
        }
        if (($userStats['streak'] ?? 0) >= 7) {
            $insights[] = ['icon'=>'🏆','text'=>"{$userStats['streak']}-day streak! You're on fire. Don't break the chain!",'type'=>'success'];
        }

        $this->json([
            'stats' => [
                'tasks'    => $taskStats,
                'sleep'    => $sleepStats,
                'workouts' => $workoutStats,
                'xp'       => $xpStats,
                'user'     => $userStats,
            ],
            'insights' => $insights,
        ]);
    }
}
