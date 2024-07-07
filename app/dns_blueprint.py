import socket
import logging
import random
from dataclasses import dataclass
from flask import render_template, Response, request
from app.base_blueprint import BaseBlueprint

dns_blueprint = BaseBlueprint("dns", __name__)
logger = logging.getLogger("waitress")


@dns_blueprint.route("/")
def index() -> Response:
    return render_template("dns.html", title="DNS")


@dns_blueprint.route("/query")
def query() -> Response:
    domain_name = request.args.get("name")

    root_ip = request.args.get("root")
    if root_ip is None:
        root_ip = "192.33.4.12"

    record_type = request.args.get("type")
    if record_type is None:
        record_type = "A"

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        build_and_send_query(domain_name, root_ip, sock)

    return {
        "1": domain_name,
        "2": root_ip,
        "3": record_type
    }


def build_and_send_query(domain_name: str, name_server_ip: str, sock: socket.socket):
    message = bytearray()
    packet_id = random.randbytes(2)
    message.extend(packet_id)
    message.append(0)                # QR opcode AA TC RD
    message.append(0)                # RA Z RCODE
    message.extend(b"\x00\x01")   # Query count
    message.extend(b"\x00\x00")   # Answer count
    message.extend(b"\x00\x00")   # Name server records
    message.extend(b"\x00\x00")   # Additional record count

    for label in domain_name.split("."):
        message.append(len(label) & 0xFF)
        message.extend(bytes(label, "utf-8"))

    message.append(0)                # End of QName
    message.extend(b"\x00\x00")   # QTYPE
    message.extend(b"\x00\x01")   # QCLASS
    sock.sendto(message, (name_server_ip, 53))

    response = sock.recv(2048)
    with open("out.bin", "wb") as f:
        f.write(response)
