import logging
from dataclasses import dataclass
from flask import Blueprint, render_template, Response, request

@dataclass
class RequestInfo:
    url: str
    method: str
    cookies: dict[str, str]
    body: str
    headers: dict[str, str]

HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
HIST_SIZE = 16

bp = Blueprint("webhook", __name__)
logger = logging.getLogger("waitress")
request_history: list[RequestInfo] = []

@bp.route("/")
def index() -> Response:
    return Response(render_template("webhook.html", history=request_history))

@bp.route("/capture", methods=HTTP_METHODS)
def capture_request() -> Response:
    info = RequestInfo(
        request.url,
        request.method,
        dict(request.cookies),
        request.data.decode(),
        dict(request.headers)
    )
    logger.info("Captured request: [%s] %s", info.method, info.url)
    while len(request_history) >= HIST_SIZE:
        request_history.pop(0)
    request_history.append(info)
    return Response(status=204)