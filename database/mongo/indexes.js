// Prism MongoDB — collections & indexes
// Run: mongosh prism < indexes.js

// ─── journals ───────────────────────────────────────────────
db.journals.createIndex({ user_id: 1, date: -1 });
db.journals.createIndex({ user_id: 1, "mood": 1 });
/*
  Document shape:
  {
    _id: ObjectId,
    user_id: Number,          // MySQL user.id
    date: "2025-04-19",
    mood: "happy" | "okay" | "sad" | "stressed" | "excited",
    text: String,
    prompt: String,           // AI journal prompt used
    tags: [String],
    xp_awarded: Number,
    created_at: ISODate
  }
*/

// ─── notes ──────────────────────────────────────────────────
db.notes.createIndex({ user_id: 1, updated_at: -1 });
db.notes.createIndex({ user_id: 1, tags: 1 });
db.notes.createIndex({ user_id: 1, "$**": "text" });  // full-text search
/*
  {
    _id: ObjectId,
    user_id: Number,
    title: String,
    body: String,             // Markdown / blocks
    tags: [String],
    pinned: Boolean,
    created_at: ISODate,
    updated_at: ISODate
  }
*/

// ─── photos ─────────────────────────────────────────────────
db.photos.createIndex({ user_id: 1, created_at: -1 });
db.photos.createIndex({ task_id: 1 });
/*
  {
    _id: ObjectId,
    user_id: Number,
    task_id: Number | null,   // linked MySQL task
    source: "camera" | "upload",
    data_url: String,         // base64 or CDN URL
    name: String,
    size_bytes: Number,
    created_at: ISODate
  }
*/

// ─── mind_maps ──────────────────────────────────────────────
db.mind_maps.createIndex({ user_id: 1, updated_at: -1 });
/*
  {
    _id: ObjectId,
    user_id: Number,
    title: String,
    nodes: [{ id, text, x, y, color, parent_id }],
    updated_at: ISODate
  }
*/

// ─── ai_conversations ───────────────────────────────────────
db.ai_conversations.createIndex({ user_id: 1, created_at: -1 });
/*
  {
    _id: ObjectId,
    user_id: Number,
    title: String,            // auto-generated from first message
    messages: [
      { role: "user" | "assistant", text: String, ts: ISODate }
    ],
    created_at: ISODate,
    updated_at: ISODate
  }
*/

// ─── biscuit_history ────────────────────────────────────────
db.biscuit_history.createIndex({ user_id: 1, date: -1 });
/*
  {
    _id: ObjectId,
    user_id: Number,
    date: "2025-04-19",
    messages: [
      { from: "biscuit" | "user", text: String, ts: ISODate }
    ]
  }
*/

// ─── soundscapes ────────────────────────────────────────────
db.user_preferences.createIndex({ user_id: 1 }, { unique: true });
/*
  {
    _id: ObjectId,
    user_id: Number,
    theme: String,
    font: String,
    language: String,
    wallpaper: String,
    sound_enabled: Boolean,
    dark_mode: Boolean,
    pomo_work_mins: Number,
    pomo_break_mins: Number,
    custom_confetti: String,
    updated_at: ISODate
  }
*/

print("✅ Prism MongoDB indexes created");
