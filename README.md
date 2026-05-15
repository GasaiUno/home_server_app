# Home Server App v0.3.0

Home Server App — лёгкая PWA-панель для домашнего сервера за VPN. Приложение объединяет пользовательский Home Mode и Admin Mode: медиа, файлы, загрузки, мониторинг, сервисы, события и настройки.

Frontend открывается на `8091`, backend API на `8090`.

## Текущий статус

Реализована версия v0.3.0.

- PWA frontend на React/Vite/TypeScript;
- FastAPI backend;
- авторизация через X-Home-Token;
- Home Mode;
- Admin Mode;
- карточки сервисов;
- быстрые действия YouTube/magnet;
- управление qBittorrent;
- список YouTube-загрузок;
- файловый браузер по разрешённым папкам;
- сводка состояния сервера;
- мониторинг;
- обзор состояния Docker/services;
- события;
- Telegram alerts;
- mobile-first UI;
- bottom navigation;
- карточный интерфейс;
- skeleton loading;
- toast notifications;
- empty/error states;
- responsive layout для телефона и desktop;
- admin service whitelist foundation;
- audit log helper;
- Docker logs foundation для разрешённых сервисов;
- русифицированный интерфейс v0.3.0;
- главная страница вокруг реальных сервисов домашнего сервера;
- группы “Фильмы и сериалы”, “Музыка”, “Загрузки”, “Файлы”, “Автоматизация”, “Администрирование”;
- glass-style mobile navigation.
- safe Docker service control для whitelisted services;
- confirm-required start/stop/restart;
- task history;
- audit log в Admin UI;
- Jellyfin/Navidrome overview cards.

## Roadmap

### v0.1 — базовая PWA-панель

- React/Vite/TypeScript frontend
- FastAPI backend
- Docker Compose
- PWA
- access token
- карточки сервисов
- YouTube/magnet actions

### v0.1.1 — Home Mode + Admin Mode

- разделение пользовательского режима и админки
- Home navigation
- Admin navigation
- Settings

### v0.1.2 — мониторинг и Telegram alerts

- CPU/RAM/Disk/Uptime
- Docker/service health
- events
- Telegram alerts

### v0.2 — загрузки, торренты и файлы

- torrents list
- pause/resume/delete
- add magnet
- upload .torrent
- YouTube downloads
- files browser
- upload/mkdir/delete, если разрешено

### v0.2.1 — mobile UI refresh

- mobile-first layout
- bottom navigation
- cards
- skeleton loading
- toast notifications
- empty states
- error states
- responsive tables/cards
- unified design system

### v0.2.2 — security/stability foundation

- admin service whitelist foundation
- unified API response helpers for new admin endpoints
- audit log helper
- confirmation model
- safe service registry
- Docker logs foundation
- backend tests for admin service permissions

### v0.2.3 — UX/UI Redesign

- service-oriented home page for real home server scenarios
- Russian-first UI labels
- refined mobile-first app shell
- glass-style bottom navigation
- asymmetric media-hub layout
- service groups: Смотреть, Слушать, Скачать, Файлы, Обслуживание
- polished loading, empty and error states
- backend/API contracts unchanged

### v0.3.0 — media overview and service control

Реализовано:

- Jellyfin overview;
- Navidrome overview;
- Docker service whitelist;
- service logs;
- safe restart/start/stop для разрешённых контейнеров;
- task history;
- audit log UI.

### v0.3.1 — backups UI

Запланировано:

- create backup;
- list backups;
- download backup;
- delete old backup;
- scheduled backup status.

### v0.4 — безопасный внешний доступ

Запланировано:

- Public/User/Admin separation;
- Cloudflare Access compatibility;
- rate limit;
- audit log;
- запрет dangerous actions из публичного режима.

### v0.5 — users and roles

Запланировано:

- Admin/User/Guest;
- login/password;
- sessions;
- permissions;
- user management;
- Telegram approve для новых пользователей.

## Следующий этап

Следующий этап разработки — v0.3.1 backups UI:

- create backup;
- list backups;
- download backup;
- delete old backup;
- scheduled backup status.

## Что нового в v0.2.2

v0.2.2 — security/stability foundation перед v0.3. Версия добавляет безопасную backend-основу для будущего Docker service control, logs viewer, task history и audit log без изменения текущих функций v0.2.1.

- Admin service whitelist: backend принимает только ключи из `ADMIN_SERVICES`, а `container_name` всегда берётся из whitelist.
- Единый формат ответов для новых admin foundation endpoints: `{ "ok": true, "data": ... }` и `{ "ok": false, "error": ... }`.
- Audit log foundation пишет события admin-действий в `backend/app_data/audit.jsonl`.
- Confirmation model подготовлен для будущих dangerous actions.
- Docker logs foundation возвращает только последние строки логов разрешённых контейнеров.
- Нет произвольных Docker-команд, `docker exec`, `docker prune`, update images или удаления контейнеров.
- Неизвестные контейнеры отклоняются.
- `homeapp-backend` защищён: stop/start/restart через API запрещены.

## v0.2.3 — UX/UI Redesign

v0.2.3 redesign 2 перестраивает frontend в медиа-хаб домашнего сервера. Главная страница больше не является абстрактным dashboard: первый экран ведёт к Jellyfin, Navidrome и добавлению загрузок, а обслуживание сервера вынесено ниже как вторичный слой.

Принципы дизайна:

- mobile-first;
- медиа-хаб вместо generic admin dashboard;
- сценарии `Смотреть`, `Слушать`, `Скачать`, `Файлы`, `Обслуживание`;
- асимметричная композиция вместо равномерной сетки карточек;
- тёмная база;
- мягкие glass panels;
- аккуратные glow accents;
- readable typography;
- статус сервера без вытеснения сервисов;
- крупные touch targets;
- понятные loading/empty/error states;
- опасные действия визуально отделены.

Интерфейс русифицирован: основные разделы, навигация, empty/error/loading states и формы используют русский язык. Английский оставлен для брендов сервисов и технических терминов вроде Docker/API.

Изменения касаются UI/UX frontend. Backend endpoints и API-контракты v0.2.2 не менялись.

## v0.2.2 — Admin security foundation

Основа Admin security в v0.2.2:

- service whitelist для будущего управления Docker services;
- API response format для новых endpoints;
- audit log foundation;
- confirmation model;
- Docker logs foundation;
- no arbitrary Docker commands;
- no unknown containers;
- no `docker exec`/`prune`/`update`/`remove`;
- `homeapp-backend` protected.

Даже если `docker.sock` смонтирован read-only, доступ к Docker API остаётся чувствительным. Приложение должно быть доступно только через VPN/защищённый доступ и сильный `HOME_APP_TOKEN`.

## Что нового в v0.2

- Управление qBittorrent: список торрентов, progress, скорости, ETA, pause/resume/delete, magnet и `.torrent` upload.
- YouTube downloads: выбор video/audio, качества и формата, список последних файлов из `YOUTUBE_PATH`.
- Файловый браузер по разрешённым папкам `media/music/torrents/youtube/books`.
- Главная страница: домашние группы сервисов, активные торренты, последние YouTube-загрузки, события и состояние диска.
- В админке: состояние сервера, мониторинг, загрузки, файлы, сервисы, события и настройки.

## UI Refresh

Интерфейс сделан mobile-first: на телефоне используется нижняя glass-навигация с safe-area отступами, крупные tap targets и карточный layout без горизонтального overflow. На desktop используется боковая навигация, ограниченная ширина контента и крупные смысловые блоки для домашней панели и админки.

Основные элементы дизайн-системы находятся во `frontend/src/styles.css`: CSS variables для цветов, радиусов, теней, spacing, состояний focus/hover/active, карточек, форм, tabs, progress bars, skeleton/error/empty states. Приложение не использует тяжёлый UI framework.

## Режимы интерфейса

- **Главная** - главный экран для повседневного использования: группы “Фильмы и сериалы”, “Музыка”, “Загрузки”, “Файлы”, “Автоматизация” и “Администрирование”.
- **Админка** - техническая панель: состояние API, время работы, список сервисов, мониторинг, журнал событий и уведомления Telegram.

После ввода токена доступа приложение открывает главную страницу по умолчанию.

## Страницы

- `/` - Главная: домашняя панель сервисов и быстрые действия.
- `/actions` - Действия: формы `Скачать YouTube`, `Добавить magnet` и загрузить `.torrent`.
- `/downloads` - Загрузки: очередь qBittorrent и текущие скорости.
- `/files` - Файлы: быстрый файловый браузер для разрешённых папок.
- `/admin` - Админка: техническая панель.
- `/settings` - Настройки: смена токена, информация об API, настройка открытия сервисов в текущем окне или новой вкладке.

## Сервисы

Карточки ведут на внутренний VPN IP сервера `10.8.1.5`:

- Фильмы / Jellyfin: `http://10.8.1.5:8096`
- Музыка / Navidrome: `http://10.8.1.5:4533`
- Торренты / qBittorrent: `http://10.8.1.5:8080`
- YouTube / MeTube: `http://10.8.1.5:8081`
- Автоматизация / n8n: `http://10.8.1.5:5678`
- Файлы / File Browser: `http://10.8.1.5:8082`
- Homepage: `http://10.8.1.5:3000`

Список карточек frontend получает из `GET /api/services`. Чтобы изменить карточку, URL, icon, accent или category, обновите конфигурацию сервисов в backend (`backend/app/config.py`) и перезапустите backend. Компоненты Home Mode не хардкодят адреса сервисов.

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
- `HOST_ROOT_PATH` - host root mount для disk metrics, в Docker обычно `/host`.
- `HOST_PROC_PATH` - host proc mount, в Docker обычно `/host/proc`.
- `HOST_SYS_PATH` - host sys mount, в Docker обычно `/host/sys`.
- `HOME_DATA_PATH` - папка данных для отдельной disk-карточки, например `/host/home/igor/server`.
- `TELEGRAM_BOT_TOKEN` - token бота для alert-уведомлений.
- `TELEGRAM_ADMIN_ID` - Telegram chat/user id администратора.
- `ALERTS_ENABLED` - включает фоновые проверки и Telegram alerts.
- `ALERT_CPU_PERCENT`, `ALERT_MEMORY_PERCENT`, `ALERT_SWAP_PERCENT`, `ALERT_DISK_PERCENT`, `ALERT_TEMPERATURE_C` - thresholds.
- `ALERT_CHECK_INTERVAL_SECONDS` - период фоновой проверки.
- `ALERT_COOLDOWN_SECONDS` - cooldown одинаковых событий.
- `QB_URL`, `QB_USERNAME`, `QB_PASSWORD`, `QB_BYPASS_AUTH` - доступ к qBittorrent API.
- `METUBE_URL` - URL MeTube API.
- `JELLYFIN_URL`, `JELLYFIN_API_KEY`, `JELLYFIN_USER_ID` - доступ backend к Jellyfin API для страницы `/media`; `JELLYFIN_USER_ID` нужен для блока “Продолжить просмотр”.
- `NAVIDROME_URL`, `NAVIDROME_USERNAME`, `NAVIDROME_PASSWORD`, `NAVIDROME_SALT` - доступ backend к Navidrome/Subsonic API для страницы `/media`.
- `MEDIA_PATH`, `MUSIC_PATH`, `TORRENTS_PATH`, `YOUTUBE_PATH`, `BOOKS_PATH` - разрешённые папки внутри backend-контейнера.
- `ALLOW_FILE_DELETE` - включает удаление файлов через Admin Files.
- `MAX_UPLOAD_SIZE_MB` - лимит upload через web UI.

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

Backend в Docker получает read-only mounts для host metrics:

- `/:/host:ro`
- `/proc:/host/proc:ro`
- `/sys:/host/sys:ro`
- `/var/run/docker.sock:/var/run/docker.sock:ro`
- `./backend/app_data:/app/app_data`
- `/home/igor/server/media:/data/media`
- `/home/igor/server/music:/data/music`
- `/home/igor/server/torrents:/data/torrents`
- `/home/igor/server/youtube:/data/youtube`
- `/home/igor/server/books:/data/books`

Предупреждение: доступ к `docker.sock` даёт backend большие права на Docker host. Даже read-only mount остаётся чувствительным доступом к Docker API. Держите приложение доступным только через VPN/защищённый доступ и защищайте сильным `HOME_APP_TOKEN`.

Открыть:

- Frontend: `http://localhost:8091`
- Backend health: `http://localhost:8090/api/health`

## API

- `GET /api/health` - без token.
- `GET /api/status` - требует `X-Home-Token`.
- `GET /api/services` - требует `X-Home-Token`.
- `POST /api/youtube` - требует `X-Home-Token`.
- `POST /api/magnet` - требует `X-Home-Token`.
- `GET /api/admin/metrics` - требует `X-Home-Token`.
- `GET /api/admin/docker` - требует `X-Home-Token`.
- `GET /api/admin/services-health` - требует `X-Home-Token`.
- `GET /api/admin/services-registry` - требует `X-Home-Token`, возвращает whitelist admin services.
- `GET /api/admin/services-registry/{name}` - требует `X-Home-Token`, возвращает один сервис из whitelist.
- `GET /api/admin/services-registry/{name}/logs?tail=200` - требует `X-Home-Token`, возвращает последние строки логов разрешённого контейнера.
- `GET /api/admin/events` - требует `X-Home-Token`.
- `POST /api/admin/alerts/test` - требует `X-Home-Token`.
- `GET /api/dashboard/summary` - требует `X-Home-Token`.
- `GET /api/torrents` - требует `X-Home-Token`.
- `POST /api/torrents/add-magnet` - требует `X-Home-Token`.
- `POST /api/torrents/upload` - multipart `.torrent`, требует `X-Home-Token`.
- `POST /api/torrents/{hash}/pause` - требует `X-Home-Token`.
- `POST /api/torrents/{hash}/resume` - требует `X-Home-Token`.
- `DELETE /api/torrents/{hash}` - требует `X-Home-Token`.
- `GET /api/youtube/downloads` - требует `X-Home-Token`.
- `GET /api/files?path=media` - требует `X-Home-Token`.
- `GET /api/files/download?path=media/file.mkv` - требует `X-Home-Token`.
- `POST /api/files/upload` - multipart upload, требует `X-Home-Token`.
- `POST /api/files/mkdir` - требует `X-Home-Token`.
- `DELETE /api/files` - требует `X-Home-Token`, работает только при `ALLOW_FILE_DELETE=true`.

Пример:

```bash
curl -H "X-Home-Token: change-me" http://localhost:8090/api/status
```

Проверка v0.2 endpoints:

```bash
curl -H "X-Home-Token: change-me" http://localhost:8090/api/dashboard/summary
curl -H "X-Home-Token: change-me" http://localhost:8090/api/torrents
curl -H "X-Home-Token: change-me" http://localhost:8090/api/youtube/downloads
curl -H "X-Home-Token: change-me" "http://localhost:8090/api/files?path=media"
```

Проверка v0.2.2 admin foundation:

```bash
curl -H "X-Home-Token: change-me" \
  http://localhost:8090/api/admin/services-registry

curl -H "X-Home-Token: change-me" \
  "http://localhost:8090/api/admin/services-registry/jellyfin/logs?tail=50"
```

## qBittorrent

По умолчанию `QB_BYPASS_AUTH=true`, backend обращается к `QB_URL=http://qbittorrent:8080` без login. Это удобно, если qBittorrent разрешает bypass/whitelist для Docker-сети `server_default`.

Если bypass отключён:

```env
QB_BYPASS_AUTH=false
QB_USERNAME=admin
QB_PASSWORD=your-password
```

Backend выполнит `POST /api/v2/auth/login` и будет использовать cookie `SID`.

## Файловый браузер

Для приложения используются только разрешённые корни:

- `media`
- `music`
- `torrents`
- `youtube`
- `books`, если папка существует

Рекомендуемый Docker mapping:

```yaml
- /home/igor/server/media:/data/media
- /home/igor/server/music:/data/music
- /home/igor/server/torrents:/data/torrents
- /home/igor/server/youtube:/data/youtube
- /home/igor/server/books:/data/books
```

Удаление файлов выключено по умолчанию:

```env
ALLOW_FILE_DELETE=false
```

Включайте только если приложение доступно строго через VPN и защищено сильным token.

## PWA на телефоне

Manifest настроен как standalone app с тёмным theme/background color. Для установки:

1. Откройте `http://10.8.1.5:8091` или локальный адрес frontend через VPN.
2. Введите access token.
3. В меню браузера выберите `Добавить на экран Домой` / `Install app`.
4. После запуска с иконки приложение откроется как отдельное PWA с нижней мобильной навигацией.

## Обновление на сервере

```bash
git pull
cp .env.example .env # только если env ещё не создан
docker compose up -d --build
```

## Мониторинг и Telegram alerts

Админка содержит вкладку `Мониторинг`. Она показывает CPU, RAM, Swap, диск, время работы, температуру, контейнеры Docker, HTTP health сервисов и журнал событий. Раздел обновляется каждые 15 секунд только когда открыта вкладка мониторинга.

Чтобы включить Telegram alerts:

1. В Telegram откройте `@BotFather`.
2. Создайте бота командой `/newbot`.
3. Скопируйте token в `TELEGRAM_BOT_TOKEN`.
4. Напишите любое сообщение вашему боту.
5. Откройте `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`.
6. Возьмите `chat.id` из ответа и укажите его в `TELEGRAM_ADMIN_ID`.
7. Убедитесь, что `ALERTS_ENABLED=true`.
8. Перезапустите compose: `docker compose up -d --build`.
9. В Админка -> Мониторинг нажмите `Тест Telegram`.

Если `TELEGRAM_BOT_TOKEN` или `TELEGRAM_ADMIN_ID` пустые, backend не падает, а UI показывает, что Telegram alerts не настроены.

Thresholds настраиваются в `.env`:

```env
ALERT_CPU_PERCENT=90
ALERT_MEMORY_PERCENT=90
ALERT_SWAP_PERCENT=70
ALERT_DISK_PERCENT=90
ALERT_TEMPERATURE_C=80
ALERT_CHECK_INTERVAL_SECONDS=60
ALERT_COOLDOWN_SECONDS=1800
```

События v0.1.2 хранятся в `backend/app_data/events.json`.

## Как изменить список сервисов

В backend откройте `backend/app/config.py` и добавьте элемент в `DEFAULT_SERVICES`:

```python
ServiceItem(
    id="new-service",
    name="Новый сервис",
    url="http://10.8.1.5:1234",
    description="Короткое описание для карточки",
    icon="server",
    accent="blue",
    category="system",
)
```

Frontend получает список через `/api/services`. Поддерживаемые `icon` задаются в `frontend/src/icons.ts`, а цветовые акценты описаны CSS-классами `accent-*` в `frontend/src/styles.css`.

## PWA на телефоне

1. Подключитесь к VPN AmneziaWG.
2. Откройте `http://10.8.1.5:8091` или адрес, на который опубликован frontend.
3. В браузере выберите установку приложения: “Добавить на экран Домой” / Install app.
4. При первом запуске введите `HOME_APP_TOKEN`.
5. В настройках можно выбрать, открывать сервисы в текущем окне PWA или в новой вкладке.

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
