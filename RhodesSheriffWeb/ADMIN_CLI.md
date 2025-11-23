# Admin CLI & Admin-Server (Kurzreferenz)

Zusätzlich zur `ADMIN_API.md` gibt es einfache CLI-Skripte und einen optionalen Admin-Server, die den Export/Import zuverlässiger machen (insbesondere wenn Vite oder andere Dev-Middleware HTTP-Routen abfängt).

CLI (schnell, lokal)

- Export (schreibt `data/storage-export.json` standardmäßig):

```bash
npx tsx RhodesSheriffWeb/scripts/admin-export.ts RhodesSheriffWeb/data/storage-export.json
```

- Import (validiert vor Import):

```bash
npx tsx RhodesSheriffWeb/scripts/admin-import.ts RhodesSheriffWeb/data/storage-export.json
```

Hinweise:
- Die CLI lädt das `storage`-Modul und ruft `exportState()` / `importState()` auf. Wenn ein separater Server-Prozess läuft, wirkt sich ein CLI‑Import nicht auf dessen In‑Memory‑State aus; der Import schreibt jedoch die persistente Datei `data/storage.json`.
- Verwende die CLI für zuverlässige Backups oder wenn die Haupt‑Dev‑Server‑Middleware (z. B. Vite) API‑Routen interceptet.

Admin-Server (optional)

- Datei: `server/admin-server.ts`
- Starten (Port 5001):

```bash
# im Projekt-Root (benötigt ggf. tsx/register)
node -r tsx/register RhodesSheriffWeb/server/admin-server.ts
```

- Endpunkte: `/export`, `/import`, `/reset`, `/save`, `/status` (entsprechen den `/api/admin/storage/*` Endpunkten).


