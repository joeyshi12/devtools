import logging
import uuid
from dataclasses import dataclass
from flask import Blueprint, render_template, Response, request, session, redirect
import mariadb

@dataclass
class RequestInfo:
    url: str
    method: str
    cookies: dict[str, str]
    body: str
    headers: dict[str, str]

HIST_SIZE = 16
WEBHOOK_ID_KEY = "webhook_id"
HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"]

webhook_blueprint = Blueprint("webhook", __name__)
logger = logging.getLogger("waitress")


@webhook_blueprint.route("/")
def index() -> Response:
    if WEBHOOK_ID_KEY not in session:
        session[WEBHOOK_ID_KEY] = uuid.uuid4()


    return Response(render_template("webhook.html", session_id=session["session_id"], history=session.get(HIST_KEY, [])))


@webhook_blueprint.route("/<str:history_id>", methods=HTTP_METHODS)
def capture_request(history_id: str) -> Response:
    info = RequestInfo(
        request.url,
        request.method,
        dict(request.cookies),
        request.data.decode(),
        dict(request.headers)
    )
    request_history = session.get(HIST_KEY, [])
    request_history.append(info)

    if len(request_history) > HIST_SIZE:
        request_history = request_history[-HIST_SIZE:]

    session[HIST_KEY] = request_history
    logger.info("Captured request (%d/%d): [%s] %s",
                len(request_history), HIST_SIZE, info.method, info.url)
    return Response(status=204)


@webhook_blueprint.route("/history", methods=["DELETE"])
def delete_history() -> Response:
    return redirect("/")
