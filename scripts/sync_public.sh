#!/usr/bin/env bash
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

 echo "Syncing src -> public..."
# Rsync src to public (mirror)
rsync -av --delete --exclude=".DS_Store" src/ public/

# Check for changes
if [ -n "$(git status --porcelain public)" ]; then
  git add public
  git commit -m "chore(web): sync public with src changes"
  git push origin $(git rev-parse --abbrev-ref HEAD)
  echo "Public synced and pushed."
else
  echo "No changes to public."
fi
