import json
import logging
from dataclasses import dataclass
from flask import Flask, Response, render_template, request
from waitress import serve
from jdtt.conversion import json_to_language_str, TargetLanguage

@dataclass
class RequestInfo:
    url: str
    method: str
    cookies: dict[str, str]
    body: str
    headers: dict[str, str]

HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
HIST_SIZE = 16

app = Flask(__name__)
logger = logging.getLogger("waitress")
request_history: list[RequestInfo] = []

def create_app() -> Flask:
    return app

@app.route("/")
def index() -> Response:
    return Response(render_template("index.html"))

@app.route("/jdtt")
def jdtt() -> Response:
    return Response(render_template("jdtt.html"))

@app.route("/webhook")
def webhook() -> Response:
    return Response(render_template("webhook.html", history=request_history))

@app.errorhandler(404)
def page_not_found(e: Exception) -> Response:
    return Response(render_template("404.html"), 404)

@app.route("/jdtt/transcompile", methods=["POST"])
def transcompile_schema() -> Response:
    try:
        target_language = TargetLanguage[request.form["targetLanguage"]]
        detect_dates = request.form["detectDates"] == "on"
        schema = json.loads(request.form["schemaText"])
        json_target_language_str = json_to_language_str(schema, target_language, "Root", detect_date=detect_dates)
        logger.info("Transcompiled schema to %s", target_language.name)
        response = Response(json_target_language_str, 200)
        response.headers["Content-Type"] = "utf-8"
        return response
    except Exception as e:
        logger.error(e)
        response = Response("Invalid JSON Object", 500)
        response.headers["Content-Type"] = "utf-8"
        return response

@app.route("/webhook/capture", methods=HTTP_METHODS)
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

if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=8080)
