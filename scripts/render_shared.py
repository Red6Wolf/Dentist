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
  <h2 id="{identifier}-title">Первый приём в «Апельсине» — всё по порядку</h2>
  <p class="first-visit-lead">Не обязательно знать название услуги и выбирать лечение заранее. При звонке расскажите, что беспокоит: администратор поможет уточнить специалиста и время. Порядок и стоимость приёма согласуйте при записи.</p>
  <ol class="first-visit-steps">
    <li>
      <span class="visit-step-label">01 / Перед визитом</span>
      <h3>Что взять с собой</h3>
      <ul>
        <li>Документ, удостоверяющий личность.</li>
        <li>Снимки, выписки и заключения — если они есть.</li>
        <li>Список лекарств и сведения об аллергиях.</li>
        <li>Для ребёнка — его документы и документы законного представителя. Состав уточните при записи.</li>
      </ul>
      <p>Не проходите дополнительное обследование заранее без назначения: какое исследование нужно, определяет врач.</p>
    </li>
    <li>
      <span class="visit-step-label">02 / На приёме</span>
      <h3>Расскажите, что беспокоит</h3>
      <p>Расскажите о жалобах, предыдущем опыте и пожеланиях. Если тревожитесь, скажите об этом: обсудите с врачом ощущения и возможность перерывов.</p>
      <p>На консультации можно обсудить состояние зубов и дёсен, необходимость диагностики и возможные варианты помощи. Состав вашего приёма уточните заранее.</p>
    </li>
    <li>
      <span class="visit-step-label">03 / Следующий шаг</span>
      <h3>Понятный план вместо догадок</h3>
      <ul>
        <li>Что требует внимания и какие обследования нужны.</li>
        <li>Какие варианты лечения можно рассмотреть.</li>
        <li>В какой последовательности проходить этапы.</li>
        <li>Что входит в расчёт стоимости и что уточняется после диагностики.</li>
      </ul>
      <p>Решение о процедурах принимайте после обсуждения с врачом. При звонке можно начать с вопроса о консультации.</p>
    </li>
  </ol>
  <a class="locbutton" href="tel:+74991853333">Позвонить для консультации</a>
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
