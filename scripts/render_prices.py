"""Обновляет статический прайс из scripts/prices.json."""

import argparse
import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICE_DATA = Path(__file__).with_name("prices.json")
COLUMNS = '<thead><tr><th scope="col">Услуга</th><th scope="col">Цена</th></tr></thead>'
COMMON_PRICES = [
    ("p01-01", "Первичный приём стоматолога-терапевта"),
    ("p01-03", "Первичный приём детского стоматолога"),
    ("p01-12", "Прицельный снимок зуба"),
    ("p02-01", "Комплексная чистка (ультразвук, Air-Flow, полировка)"),
]


class ServicePriceIndex(HTMLParser):
    def __init__(self):
        super().__init__()
        self.entries = []
        self.item = None
        self.in_name = False

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == "li" and "data-service-prices" in attributes:
            self.item = [attributes["id"], attributes["data-service-prices"], ""]
        if self.item and tag == "span":
            self.in_name = True

    def handle_data(self, data):
        if self.in_name:
            self.item[2] += data

    def handle_endtag(self, tag):
        if tag == "span":
            self.in_name = False
        if tag == "li" and self.item:
            self.entries.append(self.item)
            self.item = None


def service_price_index(rows):
    parser = ServicePriceIndex()
    parser.feed((ROOT / "pages/services.html").read_text())
    parser.close()
    entries = []
    for service_id, prices, name in parser.entries:
        if any(row_id.strip() not in rows for row_id in prices.split(",")):
            raise ValueError(f"Неизвестная позиция прайса у услуги {service_id}")
        entries.append(f'<span id="{escape(service_id)}" data-service-prices="{escape(prices)}">{escape(name.strip())}</span>')
    return "\n".join(entries)


def table(group):
    lines = [f'<table class="price-table full-price-table" aria-label="{escape(group["label"])}">']
    lines.append(f"    {COLUMNS}")
    for section in group["sections"]:
        lines.append("    <tbody>")
        if section["title"]:
            title = escape(section["title"])
            lines.append(f'        <tr data-price-subgroup><th scope="rowgroup" colspan="2">{title}</th></tr>')
        for row in section["rows"]:
            lines.extend([
                f'        <tr id="{row["id"]}" data-price-row>',
                f'            <td>{escape(row["name"])}</td>',
                f'            <td>{escape(row["price"])}</td>',
                "        </tr>",
            ])
        lines.append("    </tbody>")
    lines.append("</table>")
    return "\n".join(lines)


def indent(markup, width):
    return "\n".join(" " * width + line for line in markup.splitlines())


def directory_table(group):
    title = escape(group["title"])
    return (
        f'<details class="directory-group" data-price-group data-price-page="{group["page"]}">\n'
        f"    <summary><span><strong>{title}</strong></span></summary>\n"
        f"{indent(table(group), 4)}\n"
        "</details>"
    )


def detail_table(group, show_heading):
    title = escape(group["title"])
    heading = f"  <h2>{title}</h2>\n" if show_heading else ""
    return (
        '<section class="price-group-table">\n'
        f"{heading}{indent(table(group), 6)}\n"
        "</section>"
    )


def update(path, key, html, check):
    path = ROOT / path
    original = path.read_text()
    begin = f"<!-- prices:{key}:start -->"
    end = f"<!-- prices:{key}:end -->"
    pattern = re.compile(rf"^([ ]*){begin}\n.*?^\1{end}", re.MULTILINE | re.DOTALL)

    def render(match):
        pad = match.group(1)
        return f"{pad}{begin}\n{indent(html, len(pad))}\n{pad}{end}"

    updated, matches = pattern.subn(render, original)
    if matches != 1:
        raise ValueError(f"{path.name}: ожидается один блок {key}")
    if updated == original:
        return True
    if check:
        print(f"Нужно обновить {path.relative_to(ROOT)}")
    else:
        path.write_text(updated)
    return not check


def care_prices(rows, selected):
    entries = "".join(
        f'<tr><th scope="row">{escape(rows[key]["name"])}</th><td>{escape(rows[key]["price"])}</td></tr>'
        for key in selected
    )
    return f'<table class="price-common"><caption>Отдельные позиции прайса</caption><tbody>{entries}</tbody></table>'


def cost_examples(rows):
    examples = [
        ("Комплексная гигиена", ["p02-01"], "В названии позиции указаны ультразвук, Air-Flow и полировка. Дополнительные процедуры обсудите с врачом."),
        ("Лечение пульпита молочного зуба в два посещения", ["p04-04", "p04-05"], "В обеих позициях прайса учтена светоотверждаемая пломба. Диагностику и другие необходимые процедуры уточните отдельно."),
        ("Лечение пульпита молочного зуба в три посещения", ["p04-06", "p04-07", "p04-08"], "Это другой сценарий лечения. Число посещений определяет врач. Диагностика и дополнительные процедуры могут оплачиваться отдельно."),
    ]
    cards = []
    for title, keys, note in examples:
        amount = sum(int(re.sub(r"\D", "", rows[key]["price"])) for key in keys)
        total = f"{amount:,}".replace(",", " ") + " ₽"
        cards.append(f'<article class="care-example"><h3>{title}</h3>{care_prices(rows, keys)}<p class="care-total">Сумма указанных позиций <strong>{total}</strong></p><p>{note}</p></article>')
    return '<div class="care-examples">' + "\n".join(cards) + '</div>'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Проверить HTML без записи")
    args = parser.parse_args()
    data = json.loads(PRICE_DATA.read_text())
    groups = data["groups"]
    rows = {}
    by_page = {}
    for group in groups:
        by_page.setdefault(group["page"], []).append(group)
        for section in group["sections"]:
            for row in section["rows"]:
                if row["id"] in rows:
                    raise ValueError(f'Повторяется ID цены {row["id"]}')
                rows[row["id"]] = row

    for view in data["views"]:
        view_group = {
            "title": view["title"],
            "label": view["label"],
            "sections": [{"title": "", "rows": [rows[row_id] for row_id in view["rows"]]}],
        }
        by_page.setdefault(view["page"], []).append(view_group)
    expected_pages = {path.name for path in (ROOT / "pages").glob("price-*.html")}
    if set(by_page) != expected_pages:
        raise ValueError("Набор страниц прайса не совпадает с данными")

    preview = "\n".join(
        f'<tr>\n  <td>{escape(entry["name"])}</td>\n  <td>{escape(rows[entry["id"]]["price"])}</td>\n</tr>'
        for entry in data["preview"]
    )
    results = [
        update("index.html", "preview", preview, args.check),
        update("pages/prices.html", "directory", "\n".join(map(directory_table, groups)), args.check),
        update("pages/prices.html", "service-index", service_price_index(rows), args.check),
    ]
    common = "\n".join(
        f'<tr>\n  <th scope="row">{escape(name)}</th>\n  <td>{escape(rows[row_id]["price"])}</td>\n</tr>'
        for row_id, name in COMMON_PRICES
    )
    results.append(update("pages/prices.html", "common", common, args.check))
    results.append(update("pages/prices.html", "examples", cost_examples(rows), args.check))
    for page, key, selected in [
        ("implantation.html", "implantation", ["p01-09", "p07-04", "p07-16", "p08-01"]),
        ("veneers.html", "veneers", ["p01-09", "p07-08"]),
        ("orthodontics.html", "orthodontics", ["p01-05", "p06-14", "p06-15"]),
    ]:
        results.append(update(f"pages/{page}", key, care_prices(rows, selected), args.check))
    for page, page_groups in by_page.items():
        markup = "\n".join(detail_table(group, len(page_groups) > 1) for group in page_groups)
        results.append(update(f"pages/{page}", "detail", markup, args.check))
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
