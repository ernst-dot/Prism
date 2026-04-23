-- ═══════════════════════════════════════════════
--  Prism — MySQL Schema
-- ═══════════════════════════════════════════════

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,           -- bcrypt hash
  avatar_url  VARCHAR(500),
  xp          INT UNSIGNED DEFAULT 0,
  level       TINYINT UNSIGNED DEFAULT 1,
  streak      SMALLINT UNSIGNED DEFAULT 0,
  last_active DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tasks ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  text        VARCHAR(500) NOT NULL,
  priority    ENUM('high','medium','low','') DEFAULT '',
  due_date    DATE,
  done        TINYINT(1) DEFAULT 0,
  done_at     TIMESTAMP NULL,
  recurring   ENUM('daily','weekly','monthly','') DEFAULT '',
  location    VARCHAR(255),
  locked      TINYINT(1) DEFAULT 0,
  delegated_to VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_done (user_id, done),
  INDEX idx_due_date (due_date),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Task tags ──────────────────────────────────
CREATE TABLE IF NOT EXISTS task_tags (
  task_id  INT UNSIGNED NOT NULL,
  tag      VARCHAR(100) NOT NULL,
  PRIMARY KEY (task_id, tag),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Subtasks ───────────────────────────────────
CREATE TABLE IF NOT EXISTS subtasks (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id  INT UNSIGNED NOT NULL,
  text     VARCHAR(300) NOT NULL,
  done     TINYINT(1) DEFAULT 0,
  position TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Habits ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  emoji      VARCHAR(10) DEFAULT '🔥',
  frequency  ENUM('daily','weekly') DEFAULT 'daily',
  color      VARCHAR(7) DEFAULT '#8b5cf6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS habit_logs (
  habit_id  INT UNSIGNED NOT NULL,
  log_date  DATE NOT NULL,
  PRIMARY KEY (habit_id, log_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Calendar events ────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(300) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  color      VARCHAR(7) DEFAULT '#8b5cf6',
  all_day    TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Sleep logs ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  log_date   DATE NOT NULL,
  bedtime    TIME NOT NULL,
  wake_time  TIME NOT NULL,
  hours      DECIMAL(4,1) NOT NULL,
  quality    TINYINT UNSIGNED DEFAULT 1,   -- 0=great, 1=ok, 2=poor
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sleep_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Workouts ───────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  icon       VARCHAR(10) DEFAULT '💪',
  duration   SMALLINT UNSIGNED DEFAULT 0,   -- minutes
  xp_earned  SMALLINT UNSIGNED DEFAULT 0,
  log_date   DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── XP / level history ─────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  amount     SMALLINT NOT NULL,
  source     VARCHAR(100),                  -- 'task', 'habit', 'workout', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Friend challenges ──────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  creator_id   INT UNSIGNED NOT NULL,
  opponent_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(200) NOT NULL,
  icon         VARCHAR(10) DEFAULT '🏆',
  target       INT UNSIGNED NOT NULL,
  creator_score INT UNSIGNED DEFAULT 0,
  opponent_score INT UNSIGNED DEFAULT 0,
  ends_at      DATE NOT NULL,
  status       ENUM('active','completed','cancelled') DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reading list ───────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id  INT UNSIGNED NOT NULL,
  title    VARCHAR(300) NOT NULL,
  author   VARCHAR(200),
  status   ENUM('reading','done','want') DEFAULT 'want',
  progress TINYINT UNSIGNED DEFAULT 0,      -- 0-100
  added_at DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Bill reminders ─────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id   INT UNSIGNED NOT NULL,
  name      VARCHAR(200) NOT NULL,
  amount    DECIMAL(10,2),
  frequency ENUM('weekly','monthly','quarterly','yearly') DEFAULT 'monthly',
  next_due  DATE NOT NULL,
  emoji     VARCHAR(10) DEFAULT '💳',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Messages ───────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id    VARCHAR(100) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  username   VARCHAR(50) NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_created (room_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
