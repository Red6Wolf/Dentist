"""Создаёт страницы услуг и их маршруты из каталога и единого прайса."""

import argparse
import json
import re
from html import escape, unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PAGES = {
    "therapy": "restoration.html", "children": "children-dentistry.html",
    "hygiene": "dental-hygiene.html", "surgery": "oral-surgery.html",
    "ortho": "orthodontics.html", "implantology": "implantation.html",
    "prosthetics": "prosthetics.html", "periodontics": "gum-treatment.html",
    "aesthetics": "dental-aesthetics.html", "diagnostics": "dental-diagnostics.html",
}
SPECIAL_PAGES = {
    "1438": "caries.html", "3740": "root-canals.html", "1442": "root-canals.html",
    "1323": "root-canals.html", "3040": "root-canals.html", "983": "veneers.html",
}


def read_services(source):
    services = {}
    for direction, body in re.findall(r'<details class="directory-group" id="([^"]+)">(.*?)</details>', source, re.S):
        for service_id, attributes, body in re.findall(r'<li id="service-(\d+)"([^>]*)>(.*?)</li>', body, re.S):
            name = re.search(r'<span>(.*?)</span>', body, re.S)
            prices = re.search(r'data-service-prices="([^"]+)"', attributes)
            services[service_id] = {
                "name": unescape(name[1].strip()),
                "direction": direction,
                "page": SPECIAL_PAGES.get(service_id, DEFAULT_PAGES[direction]),
                "prices": [key.strip() for key in prices[1].split(",")] if prices else [],
            }
    expected = len(re.findall(r'<li id="service-\d+"', source))
    if not services or len(services) != expected:
        raise ValueError("Не удалось сопоставить все услуги исходного каталога")
    return services


def price_table(rows, keys):
    lines = ['<table class="price-common" data-consultation-prices>', '<caption>Отдельные позиции прайса</caption>', '<tbody>']
    for key in keys:
        row = rows[key]
        lines.append(f'<tr><th scope="row">{escape(row["name"])}</th><td>{escape(row["price"])}</td></tr>')
    return "\n".join(lines + ['</tbody>', '</table>'])


def doctor_preview(specialty):
    if not specialty:
        return ""
    source = (ROOT / "pages/doctors.html").read_text()
    section = re.search(r'<section class="profile-specialty" id="' + specialty + r'".*?</section>', source, re.S)
    if not section:
        return ""
    cards = []
    for identifier, article in re.findall(r'<article class="profile-card" id="([^"]+)">(.*?)</article>', section[0], re.S)[:2]:
        image = re.search(r'<img src="([^"]+)"', article)[1]
        name = re.search(r'<h4>(.*?)</h4>', article, re.S)[1].strip()
        role = re.search(r'<p>(.*?)</p>', article, re.S)[1].strip()
        cards.append(f'<a class="service-doctor" href="doctors.html#{identifier}"><img src="{image}" width="64" height="64" alt="" loading="lazy" /><span><strong>{name}</strong><span>{role}</span><span class="service-doctor__link">Образование и опыт</span></span></a>')
    return '<div class="service-doctor-list">' + "\n".join(cards) + '</div>'


def preparation(questions):
    options = questions + ["Что обсудить, если я тревожусь перед лечением?", "Как подготовиться к первому посещению?"]
    fields = "\n".join(
        f'<label class="consultation-option"><input type="checkbox" value="{escape(question, quote=True)}" /><span>{escape(question)}</span></label>'
        for question in options
    )
    return f'''<section class="panel subpage-section consultation-note" id="consultation" data-consultation-note>
  <h2>Подготовиться к консультации</h2>
  <p>Отметьте свои вопросы. Сохраните памятку и держите её под рукой во время звонка или приёма.</p>
  <form data-consultation-form hidden>
    <fieldset>
      <legend>Что вы хотите уточнить?</legend>
      {fields}
    </fieldset>
    <div class="consultation-actions">
      <button type="button" class="consultation-copy" data-consultation-copy>Скопировать памятку</button>
      <button type="button" class="consultation-download" data-consultation-download>Скачать памятку .txt</button>
    </div>
    <p class="consultation-status" data-consultation-status role="status" aria-live="polite"></p>
  </form>
  <noscript><p>Вопросы для консультации перечислены выше. Их можно записать и обсудить с администратором.</p></noscript>
  <a class="locbutton" href="tel:+74991853333">Позвонить администратору</a>
</section>'''


def write_file(path, content, check):
    if path.exists() and path.read_text() == content:
        return True
    if check:
        print(f"Нужно обновить {path.relative_to(ROOT)}")
        return False
    path.write_text(content)
    return True


def render(check=False):
    catalogue_path = ROOT / "pages/services.html"
    catalogue = catalogue_path.read_text()
    services = read_services(catalogue)
    rows = {row["id"]: row for group in json.loads((ROOT / "scripts/prices.json").read_text())["groups"]
            for section in group["sections"] for row in section["rows"]}
    for service in services.values():
        if any(key not in rows for key in service["prices"]):
            raise ValueError("Услуга ссылается на отсутствующую цену")
    results = []
    routes = "// Маршруты и цены генерируются из каталога и scripts/prices.json.\n"
    routes += "window.clinicServiceRoutes = " + json.dumps(services, ensure_ascii=False, indent=4) + ";\n"
    routes += "window.clinicPriceRows = " + json.dumps(rows, ensure_ascii=False, indent=4) + ";\n"
    results.append(write_file(ROOT / "scripts/service-routes.js", routes, check))

    def replace_link(match):
        service_id = match[1]
        body = match[2]
        href = services[service_id]["page"] + "?service=" + service_id
        body = re.sub(r'href="[^"]+"', f'href="{href}"', body, count=1)
        body = re.sub(r'aria-label="[^"]+"', f'aria-label="Подробнее: {escape(services[service_id]["name"], quote=True)}"', body, count=1)
        body = body.replace('>Показать цены</a>', '>Подробнее</a>').replace('>Уточнить на консультации</a>', '>Подробнее</a>')
        return f'<li id="service-{service_id}"{body}</li>'

    catalogue = re.sub(r'<li id="service-(\d+)"(.*?)</li>', replace_link, catalogue, flags=re.S)
    if 'src="../scripts/service-routes.js"' not in catalogue:
        catalogue = catalogue.replace('    <script src="../scripts/services.js', '    <script src="../scripts/service-routes.js" defer></script>\n    <script src="../scripts/services.js')
    results.append(write_file(catalogue_path, catalogue, check))
    header = re.search(r'<header class="panel subpage-hero.*?</header>', catalogue, re.S)[0]
    footer = re.search(r'<footer class="panel footer">.*?</footer>', catalogue, re.S)[0]
    definitions = json.loads((ROOT / "scripts/service_pages.json").read_text())
    for item in definitions:
        slug = item["slug"]
        direction = item["direction"]
        title = escape(item["title"])
        doctor_target = "doctors.html" + ("#" + item["doctors"] if item["doctors"] else "")
        image_index = ["therapy", "prosthetics", "implantology", "children", "hygiene", "ortho", "surgery", "periodontics", "aesthetics", "diagnostics"].index(direction)
        questions = item["questions"]
        questions_html = "\n".join(f'<li>{escape(question)}</li>' for question in questions)
        body = f'''<section class="panel subpage-section service-intro">
  <a class="content-link" href="services.html">Все услуги</a>
  <div class="service-intro__heading">
    <div><h1>{title}</h1><p class="subpage-lead">{escape(item["lead"])}</p></div>
    <span class="service-intro__image" style="background-position: {image_index % 5 * 25}% {image_index // 5 * 100}%" aria-hidden="true"></span>
  </div>
  <p class="service-context" data-service-context hidden></p>
  <div class="care-actions">
    <a class="locbutton" href="tel:+74991853333">Позвонить для записи</a>
    <a class="service-price-link" href="#service-cost">Посмотреть стоимость</a>
  </div>
</section>
<section class="panel subpage-section service-reading">
  <nav class="service-section-nav" aria-label="На странице услуги">
    <a href="#service-about">Об услуге</a><a href="#service-cost">Стоимость</a><a href="#service-doctors">Специалисты</a><a href="#consultation">Мои вопросы</a>
  </nav>
  <section id="service-about" aria-labelledby="service-about-title">
    <h2 id="service-about-title">Что обсудить с врачом</h2>
    <p>{escape(item["about"])}</p>
    <ul class="service-questions">{questions_html}</ul>
  </section>
  <section aria-labelledby="service-steps-title">
    <h2 id="service-steps-title">От вопроса к понятному плану</h2>
    <ol class="service-steps">
      <li><h3>При записи</h3><p>Назовите интересующую услугу и уточните подходящего специалиста. О подготовке спросите заранее.</p></li>
      <li><h3>На консультации</h3><p>Обсудите свою задачу и необходимую диагностику. Попросите объяснить предлагаемые варианты.</p></li>
      <li><h3>Перед лечением</h3><p>Уточните этапы, число посещений и состав расчёта. Сохраните вопросы в памятку ниже.</p></li>
    </ol>
  </section>
  <section id="service-cost" aria-labelledby="service-cost-title">
    <h2 id="service-cost-title">Стоимость и её состав</h2>
    <p data-service-cost-note>Ниже — отдельные позиции прайса по теме. Они не складываются автоматически в стоимость лечения: нужный объём определяет врач.</p>
    {price_table(rows, item["prices"])}
    <div class="service-cost-explanation">
      <div><h3>Что указано в цене</h3><p>Материал, этап или объём, прямо названный в строке прайса. Обратите внимание на оплату за канал, зуб или посещение.</p></div>
      <div><h3>Что уточнить отдельно</h3><p>Нужны ли диагностика, обезболивание, подготовка и контроль. Попросите перечислить включённые и дополнительные процедуры в вашем расчёте.</p></div>
    </div>
    <a class="content-link" data-service-full-price href="prices.html?direction={direction}">Все цены направления</a>
  </section>
  <section id="service-doctors" class="service-doctors" aria-labelledby="service-doctors-title">
    <div><h2 id="service-doctors-title">Выбрать специалиста</h2><p>Посмотрите образование и опыт врачей. Подходящего специалиста и время приёма уточните у администратора.</p></div>
    <a class="content-link" href="{doctor_target}">Врачи клиники</a>
    {doctor_preview(item["doctors"])}
  </section>
  <section aria-labelledby="service-preparation-title">
    <h2 id="service-preparation-title">Перед первым посещением</h2>
    <p>Подготовьте вопросы о вариантах, стоимости и посещениях. Если у вас есть снимки или заключения, уточните, нужно ли взять их с собой.</p>
    <a class="content-link" href="first-visit.html">Первый визит в клинику</a>
  </section>
</section>
{preparation(questions)}'''
        head = catalogue.split('<body>')[0]
        head = re.sub(r'<title>.*?</title>', f'<title>{title} — Апельсин</title>', head, flags=re.S)
        head = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/>', f'<meta name="description" content="{title}: вопросы к консультации, цены и специалисты семейной стоматологии Апельсин." />', head)
        head = head.replace('/pages/services.html"', f'/pages/{slug}.html"')
        head = re.sub(r'    <link rel="stylesheet" href="../styles/services.css[^\n]+\n', '', head)
        head = head.replace('  </head>', '    <link rel="stylesheet" href="../styles/service-detail.css" />\n  </head>')
        markup = head + f'''<body>
    <div class="page">
      <a class="skip-link" href="#main-content">Перейти к содержимому</a>
      {header}
      <main class="subpage-main service-page" id="main-content" tabindex="-1">
{body}
      </main>
      {footer}
    </div>
    <script src="../scripts/service-routes.js" defer></script>
    <script src="../scripts/consultation.js" defer></script>
    <script src="../scripts/navigation.js?v=patient-care" defer></script>
  </body>
</html>
'''
        results.append(write_file(ROOT / f"pages/{slug}.html", markup, check))
    for page in ["implantation.html", "veneers.html", "orthodontics.html"]:
        path = ROOT / "pages" / page
        content = path.read_text()
        if 'href="../styles/service-detail.css"' not in content:
            content = content.replace('  </head>', '    <link rel="stylesheet" href="../styles/service-detail.css" />\n  </head>')
        if 'data-service-context' not in content:
            content = content.replace('</h1>', '</h1>\n          <p class="service-context" data-service-context hidden></p>', 1)
            content = content.replace('</h1>', '</h1>\n          <div class="care-actions"><a class="locbutton" href="tel:+74991853333">Позвонить для записи</a><a class="service-price-link" href="#service-cost">Посмотреть стоимость</a></div>', 1)
            content = content.replace('<h2>\n            Стоимость и её состав', '<h2 id="service-cost">\n            Стоимость и её состав')
            if 'id="service-cost"' not in content:
                content = content.replace('<!-- prices:', '<span id="service-cost"></span>\n          <!-- prices:', 1)
        action = '          <div class="care-actions"><a class="locbutton" href="tel:+74991853333">Позвонить для записи</a><a class="service-price-link" href="#service-cost">Посмотреть стоимость</a></div>'
        if action in content:
            content = re.sub(r"^[ \t]*" + re.escape(action.strip()) + r"\n", "", content, count=1, flags=re.M)
            intro_end = content.index("</section>", content.index('care-intro'))
            line_start = content.rfind("\n", 0, intro_end) + 1
            content = content[:line_start] + action + "\n" + content[line_start:]
        note = preparation(["Какие варианты подходят для моей задачи?", "Из каких этапов складывается стоимость?", "Что нужно уточнить о подготовке и посещениях?"])
        if '<!-- consultation:start -->' not in content:
            content = content.replace('      </main>', f'        <!-- consultation:start -->\n{note}\n        <!-- consultation:end -->\n      </main>')
        else:
            content = re.sub(r'<!-- consultation:start -->.*?<!-- consultation:end -->', f'<!-- consultation:start -->\n{note}\n        <!-- consultation:end -->', content, flags=re.S)
        if 'src="../scripts/consultation.js"' not in content:
            content = content.replace('    <script src="../scripts/navigation.js', '    <script src="../scripts/service-routes.js" defer></script>\n    <script src="../scripts/consultation.js" defer></script>\n    <script src="../scripts/navigation.js')
        results.append(write_file(path, content, check))
    return all(results)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    raise SystemExit(0 if render(parser.parse_args().check) else 1)
