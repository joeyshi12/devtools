import datetime
import logging
import uuid
from flask import Blueprint, render_template, Response, request, session, redirect
import app.database_connection as db
from dataclasses import asdict

WEBHOOK_SESSION_ID_KEY = "webhook_id"
MAX_HIST_SIZE = 20
HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"]

webhook_blueprint = Blueprint("webhook", __name__)
logger = logging.getLogger("waitress")


@webhook_blueprint.route("/")
def index() -> Response:
    if WEBHOOK_SESSION_ID_KEY not in session or not db.webhook_history_exists(session[WEBHOOK_SESSION_ID_KEY]):
        session[WEBHOOK_SESSION_ID_KEY] = db.create_request_history()
    return redirect(f"/webhook/{session[WEBHOOK_SESSION_ID_KEY]}")


@webhook_blueprint.route("/<webhook_id>")
def webhook_history(webhook_id: str) -> Response:
    captures = db.get_request_captures(webhook_id)
    params = {
        "webhook_id": webhook_id,
        "history": captures
    }
    return Response(render_template("webhook.html", **params))


@webhook_blueprint.route("/<webhook_id>/capture", methods=HTTP_METHODS)
def capture_request(webhook_id: str) -> Response:
    capture = db.RequestCapture(
        request.url,
        request.method,
        request.data.decode(),
        dict(request.headers),
        datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    )

    # delete captures if max history size is exceeded
    captures = db.get_request_captures(webhook_id)
    if len(captures) >= MAX_HIST_SIZE:
        expire_date = captures[-MAX_HIST_SIZE].creation_date
        db.delete_request_captures(webhook_id, expire_date)

    try:
        db.insert_request_capture(webhook_id, capture)
        logger.info("Captured request [method=%s] [url=%s]", capture.method, capture.url)
        return asdict(capture)
    except Exception as e:
        logger.error("Failed to capture request: %s", e)
        return Response("Failed to capture request", status=500, mimetype="text/plain")


@webhook_blueprint.route("/<webhook_id>", methods=["DELETE"])
def delete_history(webhook_id: str) -> Response:
    db.delete_request_captures(webhook_id)
    return Response(status=204)
