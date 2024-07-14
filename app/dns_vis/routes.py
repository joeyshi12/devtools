import socket
import logging
from flask import render_template, Response, request
from dataclasses import asdict
from . import dns_vis
from .dns_lookup import dns_lookup_trace

logger = logging.getLogger("waitress")


@dns_vis.route("/")
def index() -> Response:
    return render_template("dns_vis.html", title="DNS visualizer")


@dns_vis.route("/query")
def query() -> Response:
    domain_name = request.args.get("name")

    root_ip = request.args.get("root")
    if root_ip is None:
        root_ip = "192.33.4.12"

    trace = None
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        trace = dns_lookup_trace(domain_name, root_ip, sock)

    if trace is None:
        return "Record not found", 400

    return asdict(trace)
