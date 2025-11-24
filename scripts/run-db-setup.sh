#!/usr/bin/env bash
set -euo pipefail

# Run from repo root regardless of where script is invoked from
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

SEED_PATH="RhodesSheriffWeb/data/storage.seed.json"
DRY_RUN=0

usage() {
  cat <<EOF
Usage: $0 [--seed PATH] [--dry-run]

Options:
  --seed PATH   Path to seed JSON file (default: RhodesSheriffWeb/data/storage.seed.json)
  --dry-run     Do not run seed import nor E2E check, only ensure extension + migrations
  -h, --help    Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)
      SEED_PATH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: Please set DATABASE_URL environment variable first." >&2
  echo "Example: export DATABASE_URL='postgresql://postgres:PASS@db.cbmuahrqihaimlybjyyb.supabase.co:5432/postgres'" >&2
  exit 2
fi

echo "Repo root: $REPO_ROOT"

echo "1/6 Installing pg driver (local)..."
npm install pg --no-audit --no-fund

echo "2/6 Ensuring pgcrypto extension exists..."
npx tsx scripts/create-pg-extensions.ts

echo "3/6 Pushing Drizzle migrations to DB..."
# Explicitly run drizzle-kit from repo root so it picks up drizzle.config.ts there
npx drizzle-kit push

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run enabled: skipping seed import and E2E checks. Finished.";
  exit 0
fi

echo "4/6 Importing seed data into DB..."
npx tsx scripts/seed-to-db.ts "$SEED_PATH"

echo "5/6 Running E2E admin check (login->export->import->status)..."
npx tsx RhodesSheriffWeb/scripts/e2e-admin-check.ts

echo "6/6 Done. If everything succeeded, your Supabase DB now contains the app schema and seed data."
