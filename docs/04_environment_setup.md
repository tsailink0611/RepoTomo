# RepoTomo 環境設定ガイド

## 概要
React + Node.js + PostgreSQL 構成の開発・本番環境構築手順

## 🏗️ 開発環境構築

### 1. 前提条件

```bash
# 必要なツール
node -v        # v18.0.0以上
npm -v         # v8.0.0以上
git --version  # v2.0.0以上
docker -v      # v20.0.0以上（推奨）
```

### 2. プロジェクトセットアップ

```bash
# リポジトリクローン
git clone https://github.com/tsailink0611/RepoTomo.git
cd RepoTomo

# ブランチ切り替え
git checkout migration-dev

# 依存関係インストール
npm run setup:all
```

### 3. 環境変数設定

#### バックエンド用 `.env`

```bash
# /backend/.env
NODE_ENV=development
PORT=3001

# データベース（ローカル開発用）
DATABASE_URL="postgresql://postgres:password@localhost:5432/repotomo_dev"

# JWT設定
JWT_SECRET="your-super-secret-jwt-key-32-characters-minimum"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

# LINE API
LINE_CHANNEL_ID="1234567890"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CALLBACK_URL="http://localhost:3000/auth/callback"

# 暗号化キー
ENCRYPTION_KEY="your-32-character-encryption-key"

# CORS設定
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# ログレベル
LOG_LEVEL="debug"

# Redis (セッション・キャッシュ用)
REDIS_URL="redis://localhost:6379"
```

#### フロントエンド用 `.env`

```bash
# /frontend/.env
VITE_API_BASE_URL="http://localhost:3001/api"
VITE_LINE_CHANNEL_ID="1234567890"
VITE_APP_NAME="RepoTomo"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT="development"

# PWA設定
VITE_PWA_ENABLED=true
VITE_PWA_CACHE_STRATEGY="NetworkFirst"
```

### 4. データベース設定

#### Docker Compose使用（推奨）

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: repotomo_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

#### データベース初期化

```bash
# データベース起動
docker-compose -f docker-compose.dev.yml up -d

# Prismaマイグレーション
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 初期データ投入
npx prisma db seed
```

### 5. 開発サーバー起動

```bash
# 全サービス同時起動
npm run dev

# または個別起動
npm run dev:backend   # ポート3001
npm run dev:frontend  # ポート3000
npm run dev:db        # Docker Compose
```

### 6. package.json スクリプト設定

#### ルート package.json

```json
{
  "name": "repotomo",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "setup:all": "npm install && npm run setup:backend && npm run setup:frontend",
    "setup:backend": "cd backend && npm install && npx prisma generate",
    "setup:frontend": "cd frontend && npm install",
    
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:db": "docker-compose -f docker-compose.dev.yml up",
    
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    
    "typecheck": "npm run typecheck:backend && npm run typecheck:frontend",
    "typecheck:backend": "cd backend && npm run typecheck",
    "typecheck:frontend": "cd frontend && npm run typecheck"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

#### バックエンド package.json

```json
{
  "name": "repotomo-backend",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "zod": "^3.21.4",
    "dotenv": "^16.1.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.13",
    "@types/jest": "^29.5.2",
    "typescript": "^5.1.3",
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "tsx": "^3.12.7",
    "eslint": "^8.43.0",
    "@typescript-eslint/eslint-plugin": "^5.59.11",
    "@typescript-eslint/parser": "^5.59.11"
  }
}
```

#### フロントエンド package.json

```json
{
  "name": "repotomo-frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.13.0",
    "axios": "^1.4.0",
    "zustand": "^4.3.8",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.1.1",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.14",
    "@types/react-dom": "^18.2.6",
    "@vitejs/plugin-react": "^4.0.1",
    "typescript": "^5.1.3",
    "vite": "^4.3.9",
    "vitest": "^0.32.2",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^5.16.5",
    "eslint": "^8.43.0",
    "@typescript-eslint/eslint-plugin": "^5.59.11",
    "@typescript-eslint/parser": "^5.59.11",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "tailwindcss": "^3.3.2",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}
```

## 🚀 本番環境設定

### 1. Vercel（フロントエンド）

#### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://repotomo-api.railway.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://repotomo-api.railway.app/api",
    "VITE_LINE_CHANNEL_ID": "@line_channel_id",
    "VITE_ENVIRONMENT": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

#### 本番環境変数（Vercel）

```bash
VITE_API_BASE_URL=https://repotomo-api.railway.app/api
VITE_LINE_CHANNEL_ID=<本番LINEチャンネルID>
VITE_ENVIRONMENT=production
VITE_PWA_ENABLED=true
```

### 2. Railway（バックエンド・データベース）

#### railway.toml

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "always"

[env]
NODE_ENV = "production"
PORT = { default = "3001" }
```

#### 本番環境変数（Railway）

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<Railway PostgreSQL URL>
JWT_SECRET=<本番用JWT秘密鍵>
LINE_CHANNEL_ID=<本番LINEチャンネルID>
LINE_CHANNEL_SECRET=<本番LINEシークレット>
LINE_CALLBACK_URL=https://repotomo.vercel.app/auth/callback
ENCRYPTION_KEY=<本番用暗号化キー>
ALLOWED_ORIGINS=https://repotomo.vercel.app
REDIS_URL=<Railway Redis URL>
```

### 3. SSL/TLS設定

```javascript
// backend/src/index.ts
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next()
    }
  })
}
```

## 🔍 監視・ログ設定

### 本番ログ設定

```typescript
// logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})
```

### ヘルスチェック

```typescript
// /api/health
app.get('/api/health', async (req, res) => {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`
    
    // Redis接続確認
    await redis.ping()
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV,
      database: 'connected',
      redis: 'connected'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})
```

## 🧪 CI/CD設定

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run setup:all
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: repotomo-api
```

## 📊 パフォーマンス設定

### フロントエンド最適化

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### バックエンド最適化

```typescript
// キャッシュ設定
const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${duration}`)
    next()
  }
}

// 静的データのキャッシュ（1時間）
app.get('/api/reports/templates', cacheMiddleware(3600), getReportTemplates)

// 動的データのキャッシュ（5分）
app.get('/api/dashboard/*', cacheMiddleware(300), getDashboard)
```

この環境設定により、開発から本番まで一貫した品質でRepoTomoを運用できます。