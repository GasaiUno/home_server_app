# Changelog

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

## Next: v0.3.0

Planned:
- Admin services whitelist.
- Safe Docker service control.
- Service logs viewer.
- Confirm-required restart/start/stop actions.
- Audit log.
- Task history foundation.
- Jellyfin overview.
- Navidrome overview.
