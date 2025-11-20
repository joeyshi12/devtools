import socket
import logging
from flask import render_template, request
from dataclasses import asdict

from .dns_lookup import dns_lookup_trace
from ..base_blueprint import BaseBlueprint

dns_vis_blueprint = BaseBlueprint("dns_vis", __name__)
logger = logging.getLogger(__name__)


@dns_vis_blueprint.route("/")
def index():
    return render_template("dnsvis_blueprint.html", title="DNS visualizer")


@dns_vis_blueprint.route("/query")
def query():
    domain_name = request.args.get("name")
    if domain_name is None:
        message = "Domain name is missing from query parameters"
        logger.error(message)
        return message, 400

    try:
        logger.info("Starting domain lookup for %s", domain_name)
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(1)
            trace = dns_lookup_trace(domain_name, sock)

        logger.info("Finished domain lookup for %s [answer=%s]", domain_name, trace.answer)
        return asdict(trace)
    except Exception:
        message = f"Unexpected error occurred while looking up domain {domain_name}"
        logger.exception(message)
        return message, 500

