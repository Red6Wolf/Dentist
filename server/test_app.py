"""Проверки формы обратного звонка без отправки реальных писем."""

import json
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import app


class CallbackApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = partial(app.SiteHandler, directory=str(app.SITE_ROOT))
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.endpoint = f"http://127.0.0.1:{cls.server.server_port}/api/callback"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def post(self, payload):
        request = Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            response = urlopen(request)
        except HTTPError as error:
            response = error

        with response:
            return response.status, json.load(response)

    def test_valid_application_is_passed_to_mailer(self):
        with patch.object(app, "send_callback") as send_callback:
            status, result = self.post({
                "name": "Ирина",
                "phone": "+7 (999) 123-45-67",
                "time": "Завтра после 16:00",
                "doctor": "Мухин Вячеслав Викторович",
            })

        self.assertEqual(status, 200)
        self.assertEqual(result["message"], "Заявка отправлена.")
        self.assertEqual(send_callback.call_args.args[0]["doctor"], "Мухин Вячеслав Викторович")

    def test_invalid_phone_is_rejected(self):
        with patch.object(app, "send_callback") as send_callback:
            status, result = self.post({
                "name": "Ирина",
                "phone": "123",
                "time": "Вечером",
            })

        self.assertEqual(status, 400)
        self.assertIn("телефона", result["error"])
        send_callback.assert_not_called()

    def test_unconfigured_mailer_returns_clear_error(self):
        with patch.dict("os.environ", {}, clear=True):
            status, result = self.post({
                "name": "Ирина",
                "phone": "+7 999 123 45 67",
                "time": "Вечером",
            })

        self.assertEqual(status, 503)
        self.assertIn("недоступна", result["error"])


class MailerTests(unittest.TestCase):
    def test_mailer_uses_tls_and_sends_selected_doctor(self):
        environment = {
            "SMTP_HOST": "smtp.example.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "site@example.com",
            "SMTP_PASSWORD": "secret",
            "BOOKING_TO": "clinic@example.com",
        }
        values = {
            "name": "Ирина",
            "phone": "+7 999 123-45-67",
            "time": "После 16:00",
            "doctor": "Мухин Вячеслав Викторович",
        }

        with patch.dict("os.environ", environment, clear=True):
            with patch.object(app.smtplib, "SMTP") as smtp_class:
                app.send_callback(values)

        smtp = smtp_class.return_value
        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with("site@example.com", "secret")
        message = smtp.send_message.call_args.args[0]
        self.assertEqual(message["To"], "clinic@example.com")
        self.assertIn(values["doctor"], message.get_content())


if __name__ == "__main__":
    unittest.main()
