# Run DB setup — Anleitung

Kurz: dieses Dokument beschreibt, wie du lokal die Datenbank‑Extensions, Drizzle‑Migrations und das Seed‑Importskript gegen deine Supabase/Postgres‑Datenbank ausführst und wie du den GitHub Actions Workflow nutzt.

Wichtig
- Behandle `DATABASE_URL` wie ein Secret. Niemals in Repos/Logs committen.
- Verwende eine Connection‑String mit ausreichenden Rechten (für Extension Erstellung und Schema‑Push ist meist der `postgres`-User oder `service_role` nötig).

Voraussetzungen (auf deinem Rechner)
- `node` (>=18) und `npm`
- `psql` (optional)
- Zugriff auf dein Supabase Projekt und die komplette Postgres Connection String

1) Lokal testen (schnell, ohne Seed)

Setze die Umgebungsvariable in deiner Shell (nur die aktuelle Session):

```bash
export DATABASE_URL='postgresql://postgres:DEIN_PASS@db.cbmuahrqihaimlybjyyb.supabase.co:5432/postgres'
```

Führe einen Dry‑Run (Extensions + Migrations, ohne Seed):

```bash
./scripts/run-db-setup.sh --dry-run
```

2) Voller Lauf (Extensions + Migrations + Seed + E2E)

```bash
export DATABASE_URL='postgresql://postgres:DEIN_PASS@db...supabase.co:5432/postgres'
./scripts/run-db-setup.sh
```

Option: eigenes Seed‑File angeben:

```bash
./scripts/run-db-setup.sh --seed ./RhodesSheriffWeb/data/storage.seed.json
```

3) Fehlerbehebung
- DNS/ENETUNREACH: Falls du Verbindungsfehler im Container siehst, führe die Befehle lokal auf deinem Rechner aus (Container kann ausgehende Verbindungen blockieren).
- Berechtigungen: Wenn `CREATE EXTENSION` fehlschlägt, nutze den Supabase SQL Editor und führe:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

4) GitHub Actions (CI)
- Workflow Datei: `.github/workflows/db-setup.yml` (manuell per `workflow_dispatch` auslösbar)
- Setze `DATABASE_URL` als Repository Secret: `Settings → Secrets → Actions → New repository secret`.
- In GitHub Actions UI: Repository → Actions → DB setup → Run workflow.

5) Sicherheitsempfehlung
- Nach einmaligem lokalem Setup solltest du erwägen, das verwendete Passwort zu rotieren.
- Speichere `DATABASE_URL` nur in CI‑Secrets, nicht im Quellcode.

Kontakt
- Wenn ein Schritt fehlschlägt, poste die Fehlermeldung hier — ich helfe beim Debugging.
