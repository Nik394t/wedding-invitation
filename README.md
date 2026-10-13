# Свадебное приглашение

Одностраничная интерактивная открытка: тиснёный конверт с сургучной печатью, детская фотография в арке, два серебряных медальона со стираемым слоем, главы 23 и 24 октября 2026, дресс-код и финальная записка. Со звуком: тихая фоновая мелодия и звуки предметов.

Стек: Vite, React, TypeScript, Motion, Phosphor Icons, локальные шрифты Great Vibes и Old Standard TT.

## Команды

```bash
npm run dev        # разработка
npm run check      # линтер + модульные тесты + сборка
npm run preview    # просмотр сборки на http://127.0.0.1:4173
npm run test:e2e   # сквозные тесты Playwright (телефон и десктоп)
```

Скриншоты снимаются с запущенной preview-сборки:

```bash
node scripts/capture.mjs            # ключевые сцены: 320, 390, 768, 1440
node scripts/capture-opening.mjs    # раскадровка вскрытия конверта
```

Звук пересобирается скриптами (нужны `numpy`, `scipy`, `ffmpeg`):

```bash
python3 scripts/make-sfx.py      # сургуч, шорох и выход бумаги, стирание серебра
python3 scripts/make-music.py    # фоновая мелодия
```

Чтобы поставить свою запись, положите mp3 в `public/media/audio/` и укажите путь в `music.src` файла `src/content/invitation.ts`.

## Публикация на GitHub Pages

Репозиторий: `git@github.com:Nik394t/wedding-invitation.git`. В ветке `main` — исходники, в ветке `gh-pages` — готовая сборка, которую отдаёт GitHub Pages.

```bash
git add -A && git commit -m "Описание правки" && git push   # исходники
bash scripts/deploy-pages.sh                                 # собрать и обновить сайт
```

Сборка использует относительные пути (`base: './'`), поэтому одинаково работает в корне домена, в Docker и в подпапке `nik394t.github.io/wedding-invitation/`.

## Где что лежит

- `src/content/invitation.ts` — все фразы, даты, адреса и пути к фотографиям. Тексты править здесь.
- `src/components/` — сцены: `envelope-cover`, `hero-section`, `dates-section`, `day-chapters`, `dress-code`, `closing-section`; `flora.tsx` — авторская флористика, печать и арка.
- `src/lib/sound.ts` — движок звуков предметов (Web Audio), `public/media/audio/` — мелодия и звуки.
- `src/App.css`, `src/index.css` — стили и токены.
- `public/media/originals` — исходные фотографии (не редактировать), `public/media/optimized` — WebP/AVIF.
- `DESIGN.md`, `.impeccable/` — дизайн-система и арт-контракт.
- `artifacts/screenshots` — свежие скриншоты.

Страница закрыта от индексации (`noindex`) до публикации. Имена, RSVP, таймер и подарки намеренно отсутствуют.
