import socket
import logging
from flask import render_template, request
from dataclasses import asdict
from . import dns_vis
from .dns_lookup import dns_lookup_trace

logger = logging.getLogger("waitress")


@dns_vis.route("/")
def index():
    return render_template("dns_vis.html", title="DNS visualizer")


@dns_vis.route("/query")
def query():
    domain_name = request.args.get("name")
    if domain_name is None:
        message = "Domain name is missing from query parameters"
        logger.error(message)
        return message, 400

    try:
        logger.info(f"Starting domain lookup for {domain_name}")
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(1)
            trace = dns_lookup_trace(domain_name, sock)

        logger.info(f"Finished domain lookup for {domain_name} [answer={trace.answer}]")
        return asdict(trace)
    except Exception as e:
        message = f"Unexpected error occurred while looking up domain {domain_name}"
        logger.error("%s: %s", message, e)
        return message, 500

