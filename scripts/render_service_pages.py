"""Создаёт страницы услуг и их маршруты из каталога и единого прайса."""

import argparse
import json
import re
from html import escape, unescape
from pathlib import Path
from render_shared import breadcrumbs, first_visit, callback_form, render as render_shared

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
        name = re.search(r'<h[34]>(.*?)</h[34]>', article, re.S)[1].strip()
        role = re.search(r'<p>(.*?)</p>', article, re.S)[1].strip()
        cards.append(f'<a class="service-doctor" href="doctors.html#{identifier}"><img src="{image}" width="160" height="200" alt="" loading="lazy" /><span><strong>{name}</strong><span>{role}</span><span class="service-doctor__link">Образование и опыт</span></span></a>')
    return '<div class="service-doctor-list">' + "\n".join(cards) + '</div>'


def write_file(path, content, check):
    content = "\n".join(line.rstrip() for line in content.splitlines()) + "\n"
    if path.exists() and path.read_text() == content:
        return True
    if check:
        print(f"Нужно обновить {path.relative_to(ROOT)}")
        return False
    path.write_text(content)
    return True


def service_image_content(direction, title):
    if direction == "aesthetics":
        return (
            "Сюжетная иллюстрация: улыбающаяся женщина",
            "Сюжетная иллюстрация, не клинический результат.",
        )
    return (
        f"Предметная иллюстрация: {title}",
        "Предметная иллюстрация, не клинический результат.",
    )


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
    images = json.loads((ROOT / "scripts/service_images.json").read_text())
    routes += "window.clinicServiceImages = " + json.dumps(images, ensure_ascii=False, indent=4) + ";\n"
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
        image_alt, image_note = service_image_content(direction, title)
        doctor_target = "doctors.html" + ("#" + item["doctors"] if item["doctors"] else "")
        questions = item["questions"]
        questions_html = "\n".join(f'<li>{escape(question)}</li>' for question in questions)
        body = f'''<section class="panel subpage-section service-intro">
  {breadcrumbs(item["title"], direction)}
  <div class="service-intro__heading">
    <div>
      <h1>{title}</h1>
      <p class="subpage-lead">{escape(item["lead"])}</p>
      <p class="service-context" data-service-context hidden></p>
      <div class="care-actions">
        <a class="locbutton" href="tel:+74991853333">Позвонить для консультации</a>
        <a class="service-price-link" href="#service-cost">Посмотреть стоимость</a>
      </div>
    </div>
    <figure class="service-art">
      <img class="service-intro__image" src="../assets/services/{images[direction]}" width="1024" height="1024" alt="{image_alt}" decoding="async" />
      <figcaption>{image_note}</figcaption>
    </figure>
  </div>
</section>
<nav class="service-section-nav" aria-label="На странице услуги">
    <a href="#service-about">Об услуге</a><a href="#service-cost">Стоимость</a><a href="#service-doctors">Специалисты</a><a href="#first-visit">Перед визитом</a>
</nav>
<section class="panel subpage-section service-reading">
  <section id="service-about" aria-labelledby="service-about-title">
    <h2 id="service-about-title">Что обсудить с врачом</h2>
    <p>{escape(item["about"])}</p>
    <ul class="service-questions">{questions_html}</ul>
  </section>
  <section id="service-steps" aria-labelledby="service-steps-title">
    <h2 id="service-steps-title">От вопроса к понятному плану</h2>
    <ol class="service-steps">
      <li><h3>При записи</h3><p>Назовите интересующую услугу и уточните подходящего специалиста. О подготовке спросите заранее.</p></li>
      <li><h3>На консультации</h3><p>Обсудите свою задачу и необходимую диагностику. Попросите объяснить предлагаемые варианты.</p></li>
      <li><h3>Перед лечением</h3><p>Уточните этапы, число посещений и состав расчёта. Задайте оставшиеся вопросы до начала процедур.</p></li>
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
  {first_visit()}
</section>
{callback_form()}'''
        head = catalogue.split('<body>')[0]
        head = re.sub(r'<title>.*?</title>', f'<title>{title} — Апельсин</title>', head, flags=re.S)
        head = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/>', f'<meta name="description" content="{title}: вопросы к консультации, цены и специалисты семейной стоматологии Апельсин." />', head)
        head = head.replace('/pages/services.html"', f'/pages/{slug}.html"')
        head = re.sub(r'    <link rel="stylesheet" href="../styles/services.css[^\n]+\n', '', head)
        head = re.sub(r'    <link rel="stylesheet" href="../styles/patient-experience.css" />\n', '', head)
        head = re.sub(r'    <link rel="stylesheet" href="../styles/experience-polish.css" />\n', '', head)
        head = head.replace('  </head>', '    <link rel="stylesheet" href="../styles/service-detail.css" />\n    <link rel="stylesheet" href="../styles/patient-experience.css" />\n    <link rel="stylesheet" href="../styles/experience-polish.css" />\n  </head>')
        markup = head + f'''<body>
    <div class="page">
      <a class="skip-link" href="#main-content">Перейти к содержимому</a>
      {header}
      <main class="subpage-main service-page" id="main-content" tabindex="-1" data-service-detail>
{body}
      </main>
      {footer}
    </div>
    <script src="../scripts/service-routes.js" defer></script>
    <script src="../scripts/consultation.js" defer></script>
    <script src="../scripts/callback.js" defer></script>
    <script src="../scripts/navigation.js?v=patient-care" defer></script>
    <script src="../scripts/interactions.js" defer></script>
  </body>
</html>
'''
        results.append(write_file(ROOT / f"pages/{slug}.html", markup, check))
    legacy = {
        "implantation.html": ("implantology", "Имплантация зубов", ""),
        "veneers.html": ("aesthetics", "Виниры", ""),
        "orthodontics.html": ("ortho", "Исправление прикуса", "orthodontists"),
    }
    for page, (direction, title, specialty) in legacy.items():
        image_alt, image_note = service_image_content(direction, title)
        path = ROOT / "pages" / page
        content = path.read_text()
        content = re.sub(r'\s*<!-- consultation:start -->.*?<!-- consultation:end -->', '', content, flags=re.S)
        content = re.sub(r'\s*<!-- visit-guide:start -->.*?<!-- visit-guide:end -->', '', content, flags=re.S)
        content = re.sub(r'\s*<!-- callback:start -->.*?<!-- callback:end -->', '', content, flags=re.S)
        content = re.sub(r'\s*<!-- specialists:start -->.*?<!-- specialists:end -->', '', content, flags=re.S)
        if 'href="../styles/service-detail.css"' not in content:
            content = content.replace('  </head>', '    <link rel="stylesheet" href="../styles/service-detail.css" />\n  </head>')
        content = content.replace('class="subpage-main" id="main-content" tabindex="-1"', 'class="subpage-main service-page" id="main-content" tabindex="-1" data-service-detail')
        intro = re.search(r'<section class="panel subpage-section (?:care-intro|service-intro)">.*?</section>', content, re.S)
        lead = re.search(r'<p class="subpage-lead">(.*?)</p>', intro[0], re.S)[1].strip()
        new_intro = f'''<section class="panel subpage-section service-intro">
  {breadcrumbs(title, direction)}
  <div class="service-intro__heading">
    <div>
      <h1>{title}</h1>
      <p class="subpage-lead">{lead}</p>
      <p class="service-context" data-service-context hidden></p>
      <div class="care-actions"><a class="locbutton" href="tel:+74991853333">Позвонить для консультации</a><a class="service-price-link" href="#service-cost">Посмотреть стоимость</a></div>
    </div>
    <figure class="service-art">
      <img class="service-intro__image" src="../assets/services/{images[direction]}" width="1024" height="1024" alt="{image_alt}" decoding="async" />
      <figcaption>{image_note}</figcaption>
    </figure>
  </div>
</section>'''
        content = content[:intro.start()] + new_intro + content[intro.end():]
        content = re.sub(r'\s*<nav class="service-section-nav".*?</nav>', '', content, flags=re.S)
        content = content.replace(new_intro, new_intro + '\n<nav class="service-section-nav" aria-label="На странице услуги"><a href="#service-about">Об услуге</a><a href="#service-cost">Стоимость</a><a href="#service-doctors">Специалисты</a><a href="#first-visit">Перед визитом</a></nav>', 1)
        content = content.replace('<section class="panel subpage-section care-section" id="service-about">', '<section class="panel subpage-section care-section">')
        content = content.replace('<section class="panel subpage-section care-section">', '<section class="panel subpage-section care-section" id="service-about">', 1)
        content = content.replace('<h2 id="service-cost">', '<h2>')
        cost = re.search(r'<section class="panel subpage-section care-section">\s*<h2>\s*Стоимость и её состав', content)
        if cost:
            content = content[:cost.start()] + content[cost.start():].replace('<section class="panel subpage-section care-section">', '<section class="panel subpage-section care-section" id="service-cost">', 1)
        doctors = f'''<!-- specialists:start -->
<section class="panel subpage-section care-section service-doctors" id="service-doctors">
  <div><h2>Специалисты клиники</h2><p>Посмотрите образование и опыт. Кто принимает по вашему вопросу, уточните у администратора.</p></div>
  <a class="content-link" href="doctors.html">Все врачи</a>
  {doctor_preview(specialty)}
</section>
<!-- specialists:end -->'''
        content = content.replace('      </main>', doctors + '\n<!-- visit-guide:start -->\n' + first_visit() + '\n<!-- visit-guide:end -->\n<!-- callback:start -->\n' + callback_form() + '\n<!-- callback:end -->\n      </main>')
        if 'src="../scripts/consultation.js"' not in content:
            content = content.replace('    <script src="../scripts/navigation.js', '    <script src="../scripts/service-routes.js" defer></script>\n    <script src="../scripts/consultation.js" defer></script>\n    <script src="../scripts/navigation.js')
        if 'src="../scripts/callback.js"' not in content:
            content = content.replace('    <script src="../scripts/navigation.js', '    <script src="../scripts/callback.js" defer></script>\n    <script src="../scripts/navigation.js')
        content = content.replace("Позвонить для записи", "Позвонить для консультации")
        results.append(write_file(path, content, check))
    results.append(render_shared(check))
    return all(results)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    raise SystemExit(0 if render(parser.parse_args().check) else 1)
