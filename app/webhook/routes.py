import datetime
import logging
from dataclasses import asdict
from flask import render_template, Response, request, session, redirect
from . import webhook
from .database import *

WEBHOOK_SESSION_ID_KEY = "webhook_id"
MAX_HIST_SIZE = 20
HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"]

logger = logging.getLogger("waitress")


@webhook.route("/")
def index():
    if WEBHOOK_SESSION_ID_KEY not in session or not webhook_history_exists(session[WEBHOOK_SESSION_ID_KEY]):
        session[WEBHOOK_SESSION_ID_KEY] = create_request_history()
    return redirect(f"/webhook/{session[WEBHOOK_SESSION_ID_KEY]}")


@webhook.route("/<webhook_id>")
def webhook_history(webhook_id: str):
    captures = get_request_captures(webhook_id)
    return render_template("webhook.html", title="Webhook Tester", webhook_id=webhook_id, history=captures)


@webhook.route("/<webhook_id>/capture", methods=HTTP_METHODS)
def capture_request(webhook_id: str):
    capture = RequestCapture(
        request.url,
        request.method,
        request.data.decode(),
        dict(request.headers),
        datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    )

    # delete captures if max history size is exceeded
    captures = get_request_captures(webhook_id)
    if len(captures) >= MAX_HIST_SIZE:
        expire_date = captures[-MAX_HIST_SIZE].creation_date
        delete_request_captures(webhook_id, expire_date)

    try:
        insert_request_capture(webhook_id, capture)
        logger.info("Captured request [method=%s] [url=%s]", capture.method, capture.url)
        return asdict(capture)
    except Exception:
        message = "Failed to capture request"
        logger.exception(message)
        return "Failed to capture request", 500


@webhook.route("/<webhook_id>", methods=["DELETE"])
def delete_history(webhook_id: str):
    delete_request_captures(webhook_id)
    return Response(status=204)

