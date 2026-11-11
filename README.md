# Стоматология «Апельсин» — сайт

Статический адаптивный сайт без сборщика и сторонних npm-зависимостей.

## Запуск на Mac

Откройте Terminal в этой папке и выполните:

```bash
python3 -m http.server 8000
```

Затем откройте http://127.0.0.1:8000. Остановить сервер можно сочетанием Ctrl+C.

Также можно выполнить `npm start` (требуется установленный Python 3).

## Структура

```text
.
├── index.html                 # главная страница
├── pages/                     # внутренние страницы сайта
├── styles/                    # общие и страничные стили
├── scripts/                   # интерактивность
├── assets/
│   ├── clinic/                # фото клиники и сюжетные изображения
│   └── doctors/               # портреты-примеры врачей
├── DESIGN.md                 # визуальные правила
├── PRODUCT.md                # продуктовый контекст
├── CONTRIBUTING.md           # правила читабельного кода и новых файлов
└── README.md                 # запуск и описание проекта
```

- `index.html` — разметка страницы
- `pages/` — отдельные страницы услуг, врачей, клиники и контактов
- `styles/styles.css` — основное оформление и адаптивные состояния
- `styles/pages.css` — общие стили дополнительных страниц
- `DESIGN.md` — дизайн-контракт и чек-лист перед публикацией
- `PRODUCT.md` — подтверждённый продуктовый контекст для дальнейшей работы
- `CONTRIBUTING.md` — правила форматирования кода и размещения новых файлов
- `scripts/app.js` — интерактивный выбор направления и времени для звонка
- `assets/clinic/` — фотографии интерьера и сюжетные изображения
- `assets/doctors/` — портреты-примеры для карточек врачей

В блоке команды стоят временные стоковые фотографии для визуализации карточек. Они не изображают реальных сотрудников клиники; перед публикацией замените их подтверждёнными портретами команды. Источники — Pexels: [01](https://www.pexels.com/photo/portrait-of-smiling-dentist-in-white-shirt-20596946/), [02](https://www.pexels.com/photo/female-dentist-in-modern-dental-clinic-37458354/), [03](https://www.pexels.com/photo/dental-professional-in-modern-clinic-setting-37458355/), [04](https://www.pexels.com/photo/smiling-female-dentist-in-clinic-setting-37458356/), [05](https://www.pexels.com/photo/confident-female-dentist-in-professional-attire-31043313/), [06](https://www.pexels.com/photo/female-dentist-in-white-uniform-5355860/), [07](https://www.pexels.com/photo/professional-portrait-of-a-female-dentist-31017709/), [08](https://www.pexels.com/photo/orthodontist-standing-and-smiling-in-a-clinic-14235194/). Перед публичным запуском также проверьте актуальность цен и отзывов.
