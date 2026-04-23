# Prism — Full Stack Setup

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| API | PHP 8.2 (REST) |
| Relational DB | MySQL 8 |
| Document DB | MongoDB 7 |
| Cache / Sessions | Redis |
| Auth | JWT tokens |

## Project structure
```
prism/
├── client/          # React app (Vite)
│   └── src/
│       ├── api/          # API request helpers
│       ├── components/   # Reusable UI components
│       ├── context/      # React Context (auth, tasks)
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Route-level pages
│       └── utils/        # Helpers
├── server/          # PHP backend
│   ├── api/          # Route handlers
│   ├── config/       # DB connections
│   ├── middleware/   # Auth, CORS, rate-limit
│   └── models/       # MySQL + Mongo models
└── database/
    ├── mysql/        # Schema + migrations
    └── mongo/        # Index definitions
```

## Quick start

### 1. Database
```bash
# MySQL
mysql -u root -p < database/mysql/schema.sql

# MongoDB (indexes auto-created on first run)
```

### 2. Backend (PHP)
```bash
cd server
cp .env.example .env        # fill in DB credentials
php -S localhost:8000 index.php
```

### 3. Frontend (React)
```bash
cd client
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:8000
npm run dev                 # → http://localhost:5173
```
