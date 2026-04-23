-- Prism MySQL Schema
-- Run: mysql -u root -p prism < schema.sql

CREATE DATABASE IF NOT EXISTS prism CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prism;

-- ─────────────────────────────────────
-- USERS
-- ─────────────────────────────────────
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(40)  NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash
  avatar_url  VARCHAR(500) DEFAULT NULL,
  xp          INT UNSIGNED DEFAULT 0,
  level       TINYINT UNSIGNED DEFAULT 1,
  streak      SMALLINT UNSIGNED DEFAULT 0,
  last_active DATE DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────
CREATE TABLE tasks (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  text         VARCHAR(500) NOT NULL,
  priority     ENUM('high','medium','low','') DEFAULT '',
  due_date     DATE DEFAULT NULL,
  done         TINYINT(1) DEFAULT 0,
  done_at      TIMESTAMP NULL DEFAULT NULL,
  recurring    ENUM('daily','weekly','monthly','') DEFAULT '',
  location     VARCHAR(255) DEFAULT NULL,
  delegated_to VARCHAR(40)  DEFAULT NULL,
  photo_url    VARCHAR(500) DEFAULT NULL,
  notes        TEXT DEFAULT NULL,
  position     SMALLINT UNSIGNED DEFAULT 0,  -- drag-order
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_done (user_id, done),
  INDEX idx_due (due_date)
);

-- ─────────────────────────────────────
-- SUBTASKS
-- ─────────────────────────────────────
CREATE TABLE subtasks (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id   INT UNSIGNED NOT NULL,
  text      VARCHAR(300) NOT NULL,
  done      TINYINT(1) DEFAULT 0,
  position  TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────
CREATE TABLE tags (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name    VARCHAR(50) NOT NULL,
  color   VARCHAR(7) DEFAULT '#8b5cf6',
  UNIQUE KEY uq_user_tag (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE task_tags (
  task_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- HABITS
-- ─────────────────────────────────────
CREATE TABLE habits (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  icon       VARCHAR(10) DEFAULT '🔥',
  frequency  ENUM('daily','weekly') DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE habit_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  habit_id   INT UNSIGNED NOT NULL,
  logged_at  DATE NOT NULL,
  UNIQUE KEY uq_habit_day (habit_id, logged_at),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- XP EVENTS
-- ─────────────────────────────────────
CREATE TABLE xp_events (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  amount     SMALLINT NOT NULL,
  reason     VARCHAR(100) NOT NULL,  -- e.g. 'task_complete', 'habit', 'pomodoro'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at)
);

-- ─────────────────────────────────────
-- SLEEP LOGS
-- ─────────────────────────────────────
CREATE TABLE sleep_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  log_date   DATE NOT NULL,
  bedtime    TIME NOT NULL,
  wake_time  TIME NOT NULL,
  hours      DECIMAL(4,2) NOT NULL,
  quality    TINYINT UNSIGNED DEFAULT 1,   -- 0=great 1=okay 2=poor
  UNIQUE KEY uq_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- WORKOUTS
-- ─────────────────────────────────────
CREATE TABLE workouts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  icon         VARCHAR(10) DEFAULT '💪',
  duration_min SMALLINT UNSIGNED DEFAULT 0,
  xp_earned    SMALLINT UNSIGNED DEFAULT 0,
  logged_at    DATE NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- BOOKS (reading list)
-- ─────────────────────────────────────
CREATE TABLE books (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(300) NOT NULL,
  author     VARCHAR(200) DEFAULT NULL,
  status     ENUM('reading','done','want') DEFAULT 'want',
  progress   TINYINT UNSIGNED DEFAULT 0,   -- 0-100%
  added_at   DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- FRIEND CHALLENGES
-- ─────────────────────────────────────
CREATE TABLE challenges (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  creator_id    INT UNSIGNED NOT NULL,
  opponent_id   INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(10) DEFAULT '🏆',
  target        INT UNSIGNED NOT NULL,
  creator_score INT UNSIGNED DEFAULT 0,
  opponent_score INT UNSIGNED DEFAULT 0,
  ends_at       DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- BILLS
-- ─────────────────────────────────────
CREATE TABLE bills (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  amount     DECIMAL(10,2) DEFAULT NULL,
  frequency  ENUM('week','month','quarter','year') DEFAULT 'month',
  next_due   DATE NOT NULL,
  emoji      VARCHAR(10) DEFAULT '💳',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- OKRs
-- ─────────────────────────────────────
CREATE TABLE okrs (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id   INT UNSIGNED NOT NULL,
  objective VARCHAR(300) NOT NULL,
  quarter   VARCHAR(10) NOT NULL,   -- e.g. 'Q2 2025'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE okr_key_results (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  okr_id   INT UNSIGNED NOT NULL,
  text     VARCHAR(300) NOT NULL,
  progress TINYINT UNSIGNED DEFAULT 0,  -- 0-100
  FOREIGN KEY (okr_id) REFERENCES okrs(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- LIFE GOALS
-- ─────────────────────────────────────
CREATE TABLE life_goals (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  year    SMALLINT UNSIGNED NOT NULL,
  area    VARCHAR(50) NOT NULL,
  goal    VARCHAR(300) NOT NULL,
  done    TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────
-- TASK INBOX (from other users / mom)
-- ─────────────────────────────────────
CREATE TABLE task_inbox (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_user    VARCHAR(40) NOT NULL,
  from_name  VARCHAR(100) DEFAULT 'Someone',
  text       VARCHAR(500) NOT NULL,
  priority   VARCHAR(10) DEFAULT '',
  due_date   DATE DEFAULT NULL,
  note       TEXT DEFAULT NULL,
  status     ENUM('pending','accepted','declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────
-- MESSAGES (DMs + rooms)
-- ─────────────────────────────────────
CREATE TABLE messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id    VARCHAR(100) NOT NULL,          -- 'general', 'dm_alice_bob', etc.
  user_id    INT UNSIGNED NOT NULL,
  username   VARCHAR(40) NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_created (room_id, created_at)
);
