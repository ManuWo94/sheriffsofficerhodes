#!/usr/bin/env bash
set -euo pipefail

# This script is intended to be stored in the repo and executed by CI (GitHub Actions).
# It mirrors the run-db-setup.sh behavior but uses the name requested by the UI instructions.

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
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed) SEED_PATH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1"; usage; exit 2 ;;
  esac
done

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set in environment" >&2
  exit 2
fi

echo "Repo root: $REPO_ROOT"
echo "Using DATABASE_URL from environment (secret)."

echo "1/4 Creating pg extensions (pgcrypto)..."
npx tsx scripts/create-pg-extensions.ts

echo "2/4 Pushing Drizzle migrations..."
npx drizzle-kit push

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run: skipping seed import and E2E checks.";
  exit 0
fi

echo "3/4 Importing seed data..."
npx tsx scripts/seed-to-db.ts "$SEED_PATH"

echo "4/4 (Optional) Running E2E admin check..."
npx tsx RhodesSheriffWeb/scripts/e2e-admin-check.ts || echo "E2E check failed (non-fatal in CI)"

echo "Done."
