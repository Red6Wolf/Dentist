"""Сверяет сохранённый HTML старого /price с единым прайсом проекта."""

import argparse
import html
import json
import re
from pathlib import Path


def normalize_name(value):
    return re.sub(r"[^а-яa-z0-9]", "", value.lower().replace("ё", "е"))


def compare(source):
    pairs = re.findall(
        r'<div class="[^"\n]*__cell js-price-item-search">(.*?)</div>\s*'
        r'<div class="[^"\n]*__cell">(.*?)</div>',
        source, re.DOTALL,
    )
    # Старый HTML содержит также заголовки с пустой ячейкой цены.
    old_rows = [(html.unescape(name).strip(), html.unescape(price).strip())
                for name, price in pairs if re.search(r"\d", price)]
    if not old_rows:
        raise ValueError("В исходном HTML не найдены позиции с ценами")
    data = json.loads(Path(__file__).with_name("prices.json").read_text())
    rows = [row for group in data["groups"] for section in group["sections"] for row in section["rows"]]
    current = {normalize_name(row["name"]): row for row in rows}
    old_names = {normalize_name(name) for name, _ in old_rows}
    missing, changed = [], []
    for name, price in old_rows:
        row = current.get(normalize_name(name))
        if row is None:
            missing.append(name)
        elif re.sub(r"\D", "", price) != re.sub(r"\D", "", row["price"]):
            changed.append({"name": name, "old": price, "current": row["price"]})
    return {
        "source_positions": len(old_rows),
        "current_positions": len(rows),
        "missing": missing,
        "changed_prices": changed,
        "current_only": [row["name"] for row in rows if normalize_name(row["name"]) not in old_names],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Сохранённый HTML https://stomatologiya-apelsin.ru/price")
    report = compare(parser.parse_args().source.read_text())
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(bool(report["missing"] or report["changed_prices"] or report["current_only"]))
