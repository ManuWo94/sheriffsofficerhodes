# Admin API — Storage Management

Diese Datei beschreibt die Admin-Endpoints zum Export/Import/Reset/Speichern des Runtime-Storage (nur für Entwicklungszwecke).

Auth
- Alle Endpunkte verwenden die bestehende Session-Auth. Melde dich über `/api/auth/login` an und verwende den zurückgegebenen `sessionToken` im Header `x-session-token`.
- Sensible Aktionen (`import`, `reset`) sind zusätzlich auf Benutzer mit `rank: "Sheriff"` beschränkt.

Endpoints

- GET /api/admin/storage/export
  - Liefert die gesamte Runtime-Datenstruktur als JSON-Datei (`storage-export.json`).
  - Beispiel:

```bash
curl -H "x-session-token: <token>" http://localhost:5000/api/admin/storage/export -o storage-export.json
```

- POST /api/admin/storage/import[?dryRun=1]
  - Importiert JSON-Body als neuer Runtime-State.
  - Wenn `?dryRun=1` oder `?dryRun=true` angegeben ist, wird nur eine Validierung durchgeführt und keine Änderung vorgenommen.
  - Validierung prüft grundlegende Form: Arrays für `users`, `cases`, etc. sowie Pflichtfelder `id`/`username` bei Users und `id`/`caseNumber` bei Cases.
  - Beispiel (Dry-Run):

```bash
curl -X POST -H "Content-Type: application/json" -H "x-session-token: <token>" \
  -d @my-data.json "http://localhost:5000/api/admin/storage/import?dryRun=1"
```

- POST /api/admin/storage/reset
  - Setzt den Runtime-Storage auf `data/storage.seed.json` zurück (falls vorhanden). Nur `Sheriff`.

```bash
curl -X POST -H "x-session-token: <token>" http://localhost:5000/api/admin/storage/reset
```

- POST /api/admin/storage/save
  - Erzwingt ein sofortiges Speichern der aktuellen Runtime-Daten (`data/storage.json`).

```bash
curl -X POST -H "x-session-token: <token>" http://localhost:5000/api/admin/storage/save
```

- GET /api/admin/storage/status
  - Liefert Basis-Infos zu `data/storage.json` (existiert, Größe, mtime).

```bash
curl -H "x-session-token: <token>" http://localhost:5000/api/admin/storage/status
```

Hinweise
- Diese API ist ausdrücklich für lokale Entwicklung und Tests gedacht. Für Produktion solltest du stärkere Authentifizierung, Validierung und Auditierung in Betracht ziehen.
- `import` überschreibt den gesamten Laufzeit-Storage.

