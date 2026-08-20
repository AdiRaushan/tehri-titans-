#!/bin/bash
# Restores the ORIGINAL (v1) design that was in place before the redesign.
# Usage:  ./restore-previous-design.sh   (then restart:  npm run dev)
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP="/Users/pranavsoam/website-project/.ttitans-design-v1"

if [ ! -d "$BACKUP/src" ]; then
  echo "Backup not found at $BACKUP — cannot restore."
  exit 1
fi

echo "Restoring the previous (v1) design…"
rm -rf "$PROJECT_DIR/src"
cp -R "$BACKUP/src" "$PROJECT_DIR/src"
cp "$BACKUP/tailwind.config.ts" "$PROJECT_DIR/tailwind.config.ts"
echo "Done. The original design is back."
echo "Restart the dev server:  npm run dev"
