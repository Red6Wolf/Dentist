"""Статический сайт и отправка заявок на обратный звонок через SMTP."""

import json
import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


SITE_ROOT = Path(__file__).resolve().parent.parent
PHONE_DIGITS = re.compile(r"\d{10,15}")


def validate_request(data):
    """Проверяет поля формы и возвращает значения без лишних пробелов."""
    if not isinstance(data, dict):
        raise ValueError("Проверьте заполнение формы.")

    values = {}

    for field, limit in (("name", 80), ("phone", 40), ("time", 120), ("doctor", 100)):
        value = data.get(field, "")

        if not isinstance(value, str) or len(value) > limit:
            raise ValueError("Проверьте заполнение формы.")

        values[field] = value.strip()

    if not all(values[field] for field in ("name", "phone", "time")):
        raise ValueError("Заполните имя, телефон и удобное время.")

    digits = re.sub(r"\D", "", values["phone"])

    if not PHONE_DIGITS.fullmatch(digits):
        raise ValueError("Укажите номер телефона с кодом города или страны.")

    return values


def send_callback(values):
    """Отправляет заявку на почту клиники, не сохраняя её на сервере."""
    host = os.environ.get("SMTP_HOST")
    sender = os.environ.get("SMTP_FROM") or os.environ.get("SMTP_USER")
    recipient = os.environ.get("BOOKING_TO", "info@stomatologiya-apelsin.ru")

    if not host or not sender:
        raise RuntimeError("SMTP не настроен")

    try:
        port = int(os.environ.get("SMTP_PORT", "587"))
    except ValueError as error:
        raise RuntimeError("Неверный SMTP_PORT") from error
    username = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")

    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = "Заявка на обратный звонок — Апельсин"
    message.set_content(
        "Новая заявка с сайта\n\n"
        f"Имя: {values['name']}\n"
        f"Телефон: {values['phone']}\n"
        f"Удобное время: {values['time']}\n"
        f"Врач: {values['doctor'] or 'не выбран'}\n"
    )

    if port == 465:
        smtp = smtplib.SMTP_SSL(host, port, timeout=10, context=ssl.create_default_context())
    else:
        smtp = smtplib.SMTP(host, port, timeout=10)

    with smtp:
        if port != 465:
            smtp.starttls(context=ssl.create_default_context())

        if username and password:
            smtp.login(username, password)

        smtp.send_message(message)


class SiteHandler(SimpleHTTPRequestHandler):
    """Отдаёт сайт и принимает только заявки на обратный звонок."""

    def is_public_file(self):
        """Не показывает настройки, исходники сервера и локальные документы."""
        path = unquote(urlsplit(self.path).path)

        if path == "/":
            self.path = "/index.html"
            return True

        if "\\" in path or "\x00" in path:
            return False

        parts = Path(path.lstrip("/")).parts

        if not parts or any(part.startswith(".") or part == ".." for part in parts):
            return False

        if len(parts) == 1:
            return parts[0] in {"index.html", "robots.txt", "sitemap.xml"}

        if parts[0] == "pages" and len(parts) == 2:
            return parts[1].endswith(".html")

        if parts[0] in {"styles", "scripts"} and len(parts) == 2:
            return parts[1].endswith(".css") or parts[1].endswith(".js")

        if parts[0] == "assets" and len(parts) >= 3:
            return Path(parts[-1]).suffix.lower() in {".svg", ".webp", ".jpg", ".jpeg"}

        return False

    def do_GET(self):
        if self.is_public_file():
            super().do_GET()
        else:
            self.send_error(404, "Not Found")

    def do_HEAD(self):
        if self.is_public_file():
            super().do_HEAD()
        else:
            self.send_error(404, "Not Found")

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/callback":
            self.send_json(404, {"error": "Адрес не найден."})
            return

        if self.headers.get_content_type() != "application/json":
            self.send_json(415, {"error": "Неверный формат заявки."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))

            if length < 1 or length > 4096:
                raise ValueError("Проверьте заполнение формы.")

            data = json.loads(self.rfile.read(length))
            values = validate_request(data)
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": str(error)})
            return

        try:
            send_callback(values)
        except RuntimeError:
            self.send_json(503, {"error": "Онлайн-заявка временно недоступна."})
            return
        except (OSError, smtplib.SMTPException):
            self.send_json(502, {"error": "Не удалось доставить заявку."})
            return

        self.send_json(200, {"message": "Заявка отправлена."})


if __name__ == "__main__":
    host = os.environ.get("SITE_HOST", "127.0.0.1")
    port = int(os.environ.get("SITE_PORT", "8000"))
    handler = partial(SiteHandler, directory=str(SITE_ROOT))

    with ThreadingHTTPServer((host, port), handler) as server:
        print(f"Сайт доступен на http://{host}:{port}", flush=True)
        server.serve_forever()
