from dataclasses import dataclass
import logging
from flask import Blueprint, render_template, Response, request


@dataclass
class RequestInfo:
    url: str
    method: str
    cookies: dict[str, str]
    body: str
    headers: dict[str, str]


webhook_blueprint = Blueprint("webhook", __name__)
logger = logging.getLogger("waitress")
request_history: list[RequestInfo] = []
HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT',
                'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
HIST_SIZE = 16


@webhook_blueprint.route("/")
def index() -> Response:
    return Response(render_template("webhook.html", history=request_history))


@webhook_blueprint.route("/capture", methods=HTTP_METHODS)
def capture_request() -> Response:
    info = RequestInfo(
        request.url,
        request.method,
        dict(request.cookies),
        request.data.decode(),
        dict(request.headers)
    )
    while len(request_history) >= HIST_SIZE:
        request_history.pop(0)
    logger.info("Captured request (%d/%d): [%s] %s",
                len(request_history), HIST_SIZE, info.method, info.url)
    request_history.append(info)
    return Response(status=204)
