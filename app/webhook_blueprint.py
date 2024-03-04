import datetime
import logging
import uuid
from flask import Blueprint, render_template, Response, request, session, redirect
import app.database_connection as db

WEBHOOK_SESSION_ID_KEY = "webhook_session_id"
MAX_HIST_SIZE = 20
HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"]

webhook_blueprint = Blueprint("webhook", __name__)
logger = logging.getLogger("waitress")


@webhook_blueprint.route("/")
def index() -> Response:
    if WEBHOOK_SESSION_ID_KEY not in session:
        session[WEBHOOK_SESSION_ID_KEY] = str(uuid.uuid4())
    return redirect(f"/webhook/{session[WEBHOOK_SESSION_ID_KEY]}")


@webhook_blueprint.route("/<webhook_session_id>")
def capture_history(webhook_session_id: str) -> Response:
    captures = db.get_request_captures(webhook_session_id)
    params = {
        "webhook_session_id": webhook_session_id,
        "history": captures
    }
    return Response(render_template("webhook.html", **params))


@webhook_blueprint.route("/<webhook_session_id>/capture", methods=HTTP_METHODS)
def capture_request(webhook_session_id: str) -> Response:
    capture = db.RequestCapture(
        request.url,
        request.method,
        dict(request.cookies),
        request.data.decode(),
        dict(request.headers),
        datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S")
    )

    # delete captures if max history size is exceeded
    captures = db.get_request_captures(webhook_session_id)
    if len(captures) >= MAX_HIST_SIZE:
        expire_date = captures[-MAX_HIST_SIZE].creation_date
        db.delete_request_captures(webhook_session_id, expire_date)

    try:
        db.insert_request_capture(webhook_session_id, capture)
        logger.info("Captured request [method=%s] [url=%s]", capture.method, capture.url)
        return Response(status=204)
    except Exception:
        return Response(
            f"Failed to capture request for session {webhook_session_id}",
            status=500,
            mimetype="text/plain"
        )


@webhook_blueprint.route("/<webhook_session_id>", methods=["DELETE"])
def delete_history(webhook_session_id: str) -> Response:
    db.delete_request_captures(webhook_session_id)
    return Response(status=204)
