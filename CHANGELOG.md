# Changelog

## v0.3.0

### Added
- Safe Docker service control for whitelisted services.
- Confirm-required start, stop and restart actions.
- Admin task history foundation.
- Audit log visibility in the Admin UI.
- Improved service logs workflow.
- Jellyfin and Navidrome overview cards.

### Security
- Unknown services are rejected before Docker access.
- Protected app containers cannot be stopped or restarted.
- Dangerous admin actions are written to audit/task history.

### Changed
- Admin Services tab now acts as the service-control workspace.
- README roadmap advanced to v0.3.1 backups UI.

## v0.2.3

### Added
- New media-hub visual direction for the home server.
- Refined mobile-first app shell.
- Glass-style bottom navigation.
- Asymmetric media sections for films, music, downloads and files.
- Improved page headers and status cards.
- More polished loading, empty and error states.
- Better responsive layouts for mobile and desktop.

### Improved
- Home screen service hierarchy.
- Actions page clarity.
- Downloads readability.
- Files browsing UX.
- Admin and Monitoring visual organization.
- Token screen onboarding.
- Touch target sizes.
- Visual separation of dangerous actions.

### Changed
- Updated UI styling and component system.
- Reduced generic admin-panel feeling.
- Improved consistency across pages.
- Rebuilt Home page as a Russian media hub around Jellyfin, Navidrome, qBittorrent, MeTube and File Browser.
- Replaced generic dashboard layout with an asymmetric media-first home screen.
- Localized main UI labels to Russian.
- Reworked navigation so Actions is a command instead of a main tab.
- Reworked Home service groups:
  - Смотреть;
  - Слушать;
  - Скачать;
  - Файлы;
  - Обслуживание.

## v0.2.2

### Added
- Admin service whitelist foundation.
- Unified API response helpers for new admin endpoints.
- Audit log helper for admin actions.
- Confirmation model for dangerous actions.
- Safe service registry for future Docker service control.
- Basic backend tests for admin service permissions.

### Improved
- Security model for future Docker actions.
- Documentation around docker.sock risk.
- Preparation for v0.3 service logs and safe restart/start/stop.

### Security
- Future Docker actions are restricted to a whitelist.
- Unknown services are rejected.
- homeapp-backend cannot be stopped through the API.
- Dangerous actions require explicit confirmation.
- No arbitrary shell commands are allowed.

## v0.2.1

### Added
- Mobile-first layout.
- Bottom navigation for mobile.
- Card-based mobile UI.
- Skeleton loading states.
- Toast notifications.
- Empty states.
- Error states.
- Responsive tables/cards adaptation.
- Unified visual system.

### Improved
- Home Mode usability.
- Admin Mode readability.
- Forms on mobile.
- Dashboard layout.
- Downloads and Files screens on small screens.
- Token screen visual consistency.

## v0.2.0

### Added
- qBittorrent management.
- Torrent list with progress, speed, ETA and category.
- Pause/resume/delete torrent actions.
- Magnet link submission.
- .torrent upload.
- YouTube download form.
- YouTube downloads list.
- File browser for allowed folders.
- File upload.
- Folder creation.
- Optional file deletion in Admin Mode.
- Home dashboard summary.
- Admin tabs.
- Monitoring.
- Events.
- Telegram alerts.

## v0.1.2

### Added
- Server metrics.
- Docker container status overview.
- Services health check.
- Events API.
- Telegram alert test endpoint.
- Background alert checks.

## v0.1.1

### Added
- Home Mode.
- Admin Mode.
- Separate navigation.
- Settings page.

## v0.1.0

### Added
- Initial PWA panel.
- React/Vite/TypeScript frontend.
- FastAPI backend.
- X-Home-Token authorization.
- Service cards.
- Basic YouTube and magnet actions.

## Next: v0.3.1

Planned:
- Backups UI.
- Create/list/download/delete backup actions.
- Scheduled backup status.
