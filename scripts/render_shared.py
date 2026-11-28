"""Общие части страниц: первый визит, навигация и правовая информация."""

import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIRECTIONS = {
    "therapy": "Лечение зубов", "children": "Детская стоматология",
    "hygiene": "Гигиена и профилактика", "ortho": "Исправление прикуса",
    "implantology": "Имплантация", "prosthetics": "Протезирование",
    "surgery": "Хирургия", "periodontics": "Лечение дёсен",
    "aesthetics": "Эстетика зубов", "diagnostics": "Приём и диагностика",
}


def breadcrumbs(title, direction=None):
    links = ['<li><a href="../index.html">Главная</a></li>']
    if direction:
        links.append('<li><a href="services.html">Услуги</a></li>')
        if title != DIRECTIONS[direction]:
            links.append(f'<li><a href="services.html#{direction}">{DIRECTIONS[direction]}</a></li>')
    links.append(f'<li><span aria-current="page" data-breadcrumb-current>{escape(title)}</span></li>')
    return '<nav class="breadcrumbs" aria-label="Вы здесь"><ol>\n' + "\n".join(links) + '\n</ol></nav>'


def first_visit(identifier="first-visit"):
    return f'''<section class="first-visit-guide" id="{identifier}" aria-labelledby="{identifier}-title">
  <div class="visit-intro">
    <h2 id="{identifier}-title">Сначала — ваш вопрос.</h2>
    <p class="first-visit-lead">Не нужно разбираться в названиях процедур, чтобы обратиться в «Апельсин». Начните с того, что беспокоит именно вас.</p>
    <p>«Хочу проверить зубы», «Боюсь лечения», «Ищу врача для ребёнка» — с этого уже можно начать разговор с администратором.</p>
    <a class="content-link" href="tel:+74991853333">Обсудить первый визит</a>
  </div>
  <div class="visit-questions">
    <details open>
      <summary>Что сказать при записи?</summary>
      <p>Расскажите, что беспокоит и к какому времени вам удобно прийти. Для ребёнка назовите возраст. Уточните, кто принимает с таким вопросом, сколько стоит консультация и что в неё входит.</p>
      <p>Если тревожитесь, скажите об этом заранее. Обсудите с врачом свои опасения и возможность перерывов.</p>
    </details>
    <details>
      <summary>Что взять с собой?</summary>
      <p>Документ, удостоверяющий личность; имеющиеся снимки и заключения; список лекарств и сведения об аллергиях. Для ребёнка уточните документы ребёнка и законного представителя при записи.</p>
      <p>Дополнительные снимки заранее без назначения делать не нужно: необходимое обследование определяет врач.</p>
    </details>
    <details>
      <summary>О чём спросить перед лечением?</summary>
      <p>Какие есть варианты? Зачем нужна диагностика? Что входит в расчёт, а что оплачивается отдельно? Сколько этапов предстоит?</p>
      <p>Сохраните эти вопросы или задайте свои. Состав приёма и решение о процедурах обсудите с врачом.</p>
    </details>
  </div>
</section>'''


def callback_form():
    return '''<section class="panel callback-section" id="request" aria-labelledby="request-title">
  <div>
    <h2 id="request-title">Оставьте номер. Обсудим ваш вопрос.</h2>
    <p>Администратор свяжется с вами, чтобы уточнить специалиста и время консультации. Заявка не бронирует время автоматически.</p>
    <a class="content-link" href="tel:+74991853333">Или позвоните: +7 (499) 185-33-33</a>
  </div>
  <form class="callback-form" data-callback-form action="/api/callback" method="post" novalidate>
    <div class="callback-field">
      <label for="callback-name">ФИО</label>
      <input id="callback-name" name="name" autocomplete="name" maxlength="80" minlength="2" required aria-describedby="callback-name-error" />
      <p class="field-error" id="callback-name-error" hidden></p>
    </div>
    <div class="callback-field">
      <label for="callback-phone">Номер телефона</label>
      <input id="callback-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" placeholder="+7 (___) ___-__-__" required aria-describedby="callback-phone-error" />
      <p class="field-error" id="callback-phone-error" hidden></p>
    </div>
    <div class="callback-consent">
      <label><input type="checkbox" name="consent" required aria-describedby="callback-consent-error" /><span>Даю <a href="personal-data-consent.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a> для обратного звонка.</span></label>
      <p class="field-error" id="callback-consent-error" hidden></p>
    </div>
    <p class="callback-policy"><a href="privacy-policy.html" target="_blank" rel="noopener">Политика конфиденциальности</a></p>
    <button class="locbutton" type="submit">Оставить заявку</button>
    <p class="callback-status" role="status" aria-live="polite" tabindex="-1" hidden></p>
    <noscript><p>Для отправки формы включите JavaScript или позвоните по номеру выше.</p></noscript>
  </form>
</section>'''


def legal_footer(prefix):
    return f'''<div class="footer-legal">
  <p class="footer-medical">Имеются противопоказания. Необходима консультация специалиста.</p>
  <div class="footer-company">
    <p>© 2026 «Апельсин» · ООО «Медицинские системы»</p>
    <a href="{prefix}clinic.html#licenses">Лицензия № ЛО-77-01-014479</a>
    <p>ИНН 7722351610 · ОГРН 5157746275902</p>
    <a href="{prefix}privacy-policy.html">Политика конфиденциальности</a>
  </div>
  <p>Сайт носит информационный характер и не является публичной офертой. Стоимость лечения уточняется после диагностики.</p>
</div>'''


def render(check=False):
    valid = True
    for path in [ROOT / "index.html", *sorted((ROOT / "pages").glob("*.html"))]:
        if path.name.startswith("price-"):
            continue
        source = path.read_text()
        result = source
        prefix = "pages/" if path.name == "index.html" else ""
        if '<div class="footer-legal">' in result:
            result = re.sub(r'<div class="footer-legal">.*?(?=\s*</footer>)', legal_footer(prefix), result, count=1, flags=re.S)
        else:
            result = re.sub(r'<div class="foot-end">.*?</div>', legal_footer(prefix), result, count=1, flags=re.S)
        if 'styles/patient-experience.css' not in result:
            css_prefix = "" if path.name == "index.html" else "../"
            result = result.replace('  </head>', f'    <link rel="stylesheet" href="{css_prefix}styles/patient-experience.css" />\n  </head>')
        if path.name != "index.html" and 'class="breadcrumbs"' not in result:
            title = re.search(r'<h1\b[^>]*>(.*?)</h1>', result, re.S)
            if title:
                label = ' '.join(re.sub(r'<[^>]*>', '', title[1]).split())
                result = re.sub(r'(<main\b[^>]*>)', lambda m: m[0] + '\n' + breadcrumbs(label), result, count=1)
        if result != source:
            if check:
                print(f"Нужно обновить {path.relative_to(ROOT)}")
                valid = False
            else:
                path.write_text(result)
    return valid


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    raise SystemExit(0 if render(parser.parse_args().check) else 1)
