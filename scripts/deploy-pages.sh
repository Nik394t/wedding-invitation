#!/usr/bin/env bash
# Публикация на GitHub Pages: собирает проект и кладёт готовую сборку в ветку gh-pages.
# Запуск:  bash scripts/deploy-pages.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE="$(git remote get-url origin)"
npm run build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"

git -C "$TMP" init -q -b gh-pages
git -C "$TMP" add -A
git -C "$TMP" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" \
  commit -q -m "Публикация сборки $(date '+%Y-%m-%d %H:%M')"
# Ветка gh-pages хранит только последнюю сборку, поэтому перезаписывается целиком.
git -C "$TMP" push -f "$REMOTE" gh-pages
echo "Готово: ветка gh-pages обновлена."
