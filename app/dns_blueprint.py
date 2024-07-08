import socket
import struct
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
        response = build_and_send_query(domain_name, root_ip, sock)
        decode_response(response)

    return {
        "1": domain_name,
        "2": root_ip,
        "3": record_type
    }


def build_and_send_query(domain_name: str, name_server_ip: str, sock: socket.socket) -> bytes:
    message = bytearray()
    packet_id = random.randbytes(2)
    message.extend(packet_id)
    message.append(0)             # QR opcode AA TC RD
    message.append(0)             # RA Z RCODE
    message.extend(b"\x00\x01")   # Query count
    message.extend(b"\x00\x00")   # Answer count
    message.extend(b"\x00\x00")   # Name server records
    message.extend(b"\x00\x00")   # Additional record count

    for label in domain_name.split("."):
        message.append(len(label) & 0xff)
        message.extend(bytes(label, "utf-8"))

    message.append(0)             # End of QName
    message.extend(b"\x00\x00")   # QTYPE
    message.extend(b"\x00\x01")   # QCLASS

    sock.sendto(message, (name_server_ip, 53))
    return sock.recv(512)


def decode_response(response: bytes):
    response_id = struct.unpack(">H", response[:2])[0]

    is_authoritative = response[3] & 0b00000100
    an_count = struct.unpack(">H", response[6:8])[0]
    ns_count = struct.unpack(">H", response[8:10])[0]
    ar_count = struct.unpack(">H", response[10:12])[0]
    name = read_ns_resource(response, 12).decode("utf-8")
    offset = 18 + len(name)

    an_records = []
    ns_records = []
    ar_records = []
    for _ in range(an_count + ns_count + ar_count):
        name = read_ns_resource(response, offset)
        offset += 2 + len(name)
        type_code = struct.unpack(">H", response[offset:offset + 2])[0]
        offset += 4  # skip CLASS
        ttl = struct.unpack(">I", response[offset:offset + 4])[0]
        offset += 6  # skip RDLENGTH
        match type_code:
            case 1:
                print("A")
                print(response[offset:offset + 4])
                offset += 4
            case 2 | 5:
                print("NS or CNAME")
                name = read_ns_resource(response, offset)
                print(name.decode("utf-8"))
                offset += 2 + len(name)
            case 28:
                print("AAAA")
            case _:
                print("OTHER")


def read_ns_resource(buf: bytes, offset: int) -> bytearray:
    resource_bytes = bytearray()
    current_byte = buf[offset]
    remaining_chars = 0
    while current_byte != 0:
        if ((current_byte & 0xc0) == 0xc0 or remaining_chars == 0) and len(resource_bytes) > 0:
            resource_bytes.append(0x2e)

        if ((current_byte & 0xc0) == 0xc0):
            offset += 1
            name_offset = ((current_byte & 0x3f) << 4) + buf[offset]
            resource_bytes.extend(read_ns_resource(buf, name_offset))
            return resource_bytes

        if (remaining_chars == 0):
            remaining_chars = current_byte
        else:
            resource_bytes.append(current_byte)
            remaining_chars -= 1

        offset += 1
        current_byte = buf[offset]

    return resource_bytes
