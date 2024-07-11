import socket
import logging
from flask import render_template, Response, request
from dataclasses import asdict
from . import dns
from .models import DNSLookupResult, DNSNode
from .dns_lookup import dns_lookup

logger = logging.getLogger("waitress")


@dns.route("/")
def index() -> Response:
    return render_template("dns.html", title="DNS")


@dns.route("/query")
def query() -> Response:
    domain_name = request.args.get("name")

    root_ip = request.args.get("root")
    if root_ip is None:
        root_ip = "192.33.4.12"

    node_map = {}
    referrals = {}
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        answer = dns_lookup(DNSNode("root", root_ip), domain_name, node_map, referrals, set(), sock)

    return asdict(DNSLookupResult(
        answer.ip_addr if answer else None,
        list(node_map.values()),
        referrals
    ))
