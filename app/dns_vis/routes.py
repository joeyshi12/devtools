import socket
import logging
from flask import render_template, Response, request
from dataclasses import asdict
from . import dns_vis
from .models import DNSLookupResult
from .dns_lookup import DNSLookup

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

    service = DNSLookup(root_ip)
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        answer = service.lookup(domain_name, sock)

    return asdict(DNSLookupResult(
        answer.ip_addr if answer else None,
        service.get_connected_nodes(),
        service.referrals
    ))
