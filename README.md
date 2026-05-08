# Home Server App v0.1

Лёгкая PWA-панель для домашнего сервера за VPN. Frontend открывается на `8091`, backend API на `8090`.

## Сервисы

Карточки v0.1 ведут на внутренний VPN IP сервера `10.8.1.5`:

- Jellyfin: `http://10.8.1.5:8096`
- Navidrome: `http://10.8.1.5:4533`
- qBittorrent: `http://10.8.1.5:8080`
- MeTube: `http://10.8.1.5:8081`
- n8n: `http://10.8.1.5:5678`
- File Browser: `http://10.8.1.5:8082`
- Homepage: `http://10.8.1.5:3000`

## Env

Скопируйте пример и задайте token:

```bash
cp .env.example .env
```

Переменные:

- `HOME_APP_TOKEN` - shared secret для всех `/api/*`, кроме `/api/health`.
- `N8N_YT_WEBHOOK` - webhook для YouTube, по умолчанию `http://n8n:5678/webhook/yt`.
- `N8N_MAGNET_WEBHOOK` - webhook для magnet, по умолчанию `http://n8n:5678/webhook/magnet`.
- `CORS_ORIGINS` - origins frontend через запятую.

Секреты не хранятся в коде. `.env` добавлен в `.gitignore`.

## Локальный запуск

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
HOME_APP_TOKEN=change-me uvicorn app.main:app --host 0.0.0.0 --port 8090
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Vite dev server проксирует `/api` на `http://localhost:8090`.

## Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

Открыть:

- Frontend: `http://localhost:8091`
- Backend health: `http://localhost:8090/api/health`

## API

- `GET /api/health` - без token.
- `GET /api/status` - требует `X-Home-Token`.
- `GET /api/services` - требует `X-Home-Token`.
- `POST /api/youtube` - требует `X-Home-Token`.
- `POST /api/magnet` - требует `X-Home-Token`.

Пример:

```bash
curl -H "X-Home-Token: change-me" http://localhost:8090/api/status
```

## Как добавить карточку сервиса

В backend откройте `backend/app/config.py` и добавьте элемент в `DEFAULT_SERVICES`:

```python
ServiceItem(name="New Service", url="http://10.8.1.5:1234", description="Description")
```

Frontend получает список через `/api/services`. Если нужно отдельное icon mapping, добавьте имя сервиса в `frontend/src/App.tsx` в `iconByName`.

## PWA на телефоне

1. Подключитесь к VPN AmneziaWG.
2. Откройте `http://10.8.1.5:8091` или адрес, на который опубликован frontend.
3. В браузере выберите установку приложения: Add to Home Screen / Install app.
4. При первом запуске введите `HOME_APP_TOKEN`.

## Проверки разработки

Backend tests:

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests -q
```

Frontend build:

```bash
cd frontend
npm install
npm run build
```
