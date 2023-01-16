from dataclasses import dataclass
from flask import Flask, Response, render_template, request

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
request_history: list[RequestInfo] = []

@app.route("/")
def index() -> Response:
    return Response(render_template("index.html", history=request_history))

@app.route("/webhook", methods=HTTP_METHODS)
def webhook() -> Response:
    info = RequestInfo(
        request.url,
        request.method,
        dict(request.cookies),
        request.data.decode(),
        dict(request.headers)
    )
    print(info.headers)
    while len(request_history) >= HIST_SIZE:
        request_history.pop(0)
    request_history.append(info)
    return Response(status=204)

if __name__ == "__main__":
    app.run("0.0.0.0", 8080)
