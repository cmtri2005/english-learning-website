# Monolingo - English Learning Platform

Nền tảng luyện thi TOEIC với AI hỗ trợ chấm Speaking & Writing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![PHP](https://img.shields.io/badge/php-%3E%3D8.1-purple)

## Features

- **TOEIC Practice Exams** - 200+ đề Listening & Reading với chấm điểm tự động
- **Speaking Practice** - Tra phát âm từ vựng, luyện nói với AI đánh giá
- **Writing Practice** - Viết essay với feedback từ AI về grammar, vocabulary
- **Dashboard** - Theo dõi tiến độ học tập, điểm số qua các bài thi
- **Blog** - Chia sẻ kinh nghiệm học tiếng Anh từ cộng đồng

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| Backend | PHP 8.1, Custom Router, PDO MySQL |
| Database | MySQL 8.0 |
| AI/LLM | Groq API (Llama models) |
| Storage | MinIO (S3-compatible) |
| Container | Docker, Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js >= 18 (for local frontend dev)

### 1. Clone repository

```bash
git clone https://github.com/cmtri2005/english-learning-website.git
cd english-learning-website
```

### 2. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required variables:
```env
# Database
MYSQL_ROOT_PASSWORD=your_password
MYSQL_DATABASE=app_db

# JWT
JWT_SECRET=your_secret_key

# Groq API (for AI features)
GROQ_API_KEY=your_groq_api_key
```

### 3. Start with Docker

```bash
docker-compose up -d
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8088
- **MinIO Console**: http://localhost:9001

### 4. Import exam data (first time setup)

```bash
docker exec -it php-api php scripts/import_exams_v2.php
```

### 5. Create admin account

```bash
docker exec -it php-api php scripts/create_admin.php admin@example.com yourpassword "Admin Name"
```

## Development

### Frontend (local development)

```bash
cd frontend
npm install
npm run dev
```

### Backend

Backend runs in Docker. Changes to PHP files are hot-reloaded.

### Database

Schema is auto-initialized from `db/init/01_init.sql` on first run.

## Project Structure

```
├── frontend/           # React application
│   ├── src/
│   │   ├── pages/     # Route pages
│   │   ├── services/  # API clients
│   │   └── shared/    # Shared components, hooks
│   └── ...
├── backend/            # PHP API
│   ├── Controllers/   # Request handlers
│   ├── Models/        # Database models
│   ├── Routes/        # Route definitions
│   └── scripts/       # CLI scripts
├── db/
│   └── init/          # Database init scripts
├── data/              # TOEIC exam data (JSON)
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Exams
- `GET /api/exams` - List exams
- `GET /api/exams/:id` - Get exam detail
- `POST /api/exams/:id/start` - Start exam attempt
- `POST /api/exams/:id/submit` - Submit answers

### Blog
- `GET /api/blogs` - List blogs
- `GET /api/blogs/show?slug=xxx` - Get blog by slug
- `POST /api/blogs` - Create blog (auth required)

### Admin
- `GET /api/admin/users` - List users (admin only)
- `GET /api/admin/blogs` - List blogs for moderation
- `GET /api/admin/stats` - Dashboard statistics

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Developed by cmtri2005**
