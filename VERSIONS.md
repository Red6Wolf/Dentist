# История версий сайта «Апельсин»

Каждая строка ниже — сохранённое состояние всего сайта. Теги и коммиты доступны в [репозитории GitHub](https://github.com/Red6Wolf/Dentist). Текущая версия находится в ветке `main`.

| Точка сохранения | Что было сделано | Коммит |
| --- | --- | --- |
| [`snapshot-01-initial`](https://github.com/Red6Wolf/Dentist/tree/snapshot-01-initial) | Первая версия сайта | `e223ff8` |
| [`snapshot-02-content`](https://github.com/Red6Wolf/Dentist/tree/snapshot-02-content) | Перенесены услуги, цены, врачи и материалы клиники | `aeb6289` |
| [`snapshot-03-map-slider`](https://github.com/Red6Wolf/Dentist/tree/snapshot-03-map-slider) | Карта Яндекса и карточки направлений | `9f8b97e` |
| [`snapshot-04-clinic-doctors`](https://github.com/Red6Wolf/Dentist/tree/snapshot-04-clinic-doctors) | Обновлён блок клиники и раскрытие сведений о врачах | `5cdfc4f` |
| [`snapshot-05-prices-carousel`](https://github.com/Red6Wolf/Dentist/tree/snapshot-05-prices-carousel) | Автоматический слайдер и понятные ссылки на прайс; быстрое вращение апельсина | `0b7d4ae` |
| [`snapshot-06-slow-orange`](https://github.com/Red6Wolf/Dentist/tree/snapshot-06-slow-orange) | Спокойное вращение апельсина и сохранённая история версий | текущий коммит |

## Как вернуться к прежней версии

Назовите нужную точку сохранения, например `snapshot-04-clinic-doctors`. Её можно открыть в GitHub по ссылке выше и сравнить с текущим сайтом. Для возврата в `main` создаётся **новый коммит** с файлами из выбранной точки: предыдущие версии остаются доступны.

Если возвращать версию через терминал, сначала убедитесь, что `git status --short` не показывает незавершённых изменений в отслеживаемых файлах. Затем выполните в папке проекта:

```bash
git fetch origin --tags
git restore --source=snapshot-04-clinic-doctors --staged --worktree .
git commit -m "Restore snapshot-04-clinic-doctors"
git push origin main
```

Замените имя тега во второй и третьей командах на нужное. Этот способ сохраняет историю Git; локальные файлы, которые не добавлены в Git, не затрагиваются.
