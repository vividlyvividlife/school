# Учебные материалы — 2 класс

Статический сайт с материалами для начальной школы: раздаточные карточки и тренажёр примеров. Сделан на Astro, собирается в статические HTML/CSS/JS и публикуется на GitHub Pages.

## Что внутри

- `src/pages/` — страницы сайта.
- `src/layouts/BaseLayout.astro` — общий каркас, меню и хлебные крошки.
- `src/data/navigation.ts` — единое дерево разделов для меню и крошек.
- `public/js/` — логика тренажёра и генератора карточек.
- `src/styles/` — стили сайта и печатной версии.
- `.github/workflows/deploy.yml` — сборка и публикация на GitHub Pages.

## Локальный запуск

```bash
npm ci
npm run dev
```

Сборка и предпросмотр:

```bash
npm run build
npm run preview
```

## Публикация на GitHub Pages

Сайт публикуется автоматически при пуше в `main`.

1. В GitHub откройте **Settings → Pages**.
2. В разделе **Build and deployment** выберите **Source: GitHub Actions**.
3. Сделайте пуш в `main` или запустите workflow вручную во вкладке **Actions**.
4. После завершения деплоя сайт будет доступен по адресу:
   `https://vividlyvividlife.github.io/school/`

Для project pages базовый путь `/school` подставляется автоматически в workflow.

Репозиторий должен быть публичным. Для приватного репозитория GitHub Pages требует платный план (Pro/Team/Enterprise).

## Структура маршрутов

- `/` — главная.
- `/2-class/matematika/primery/` — тренажёр примеров.
- `/2-class/matematika/razdatochnyy-material/` — карточки для печати.

При добавлении нового раздела достаточно создать страницу в `src/pages/` и добавить запись в `src/data/navigation.ts` — меню, крошки и активный пункт обновятся автоматически.
