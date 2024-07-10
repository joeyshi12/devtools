import socket
import logging
from dataclasses import dataclass
from flask import render_template, Response, request
from app.base_blueprint import BaseBlueprint
from app.dns import dns_query

dns_blueprint = BaseBlueprint("dns", __name__)
logger = logging.getLogger("waitress")

@dataclass
class DNSNode:
    name: str
    ip_addr: str


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

    node_map = {}
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        print(dns_lookup(DNSNode("root", root_ip), domain_name, node_map, set(), sock))

    return node_map


def dns_lookup(curr_node: DNSNode,
               domain_name: str,
               node_map: dict[str, DNSNode],
               visited_names: set[str],
               sock: socket.socket):
    visited_names.add(curr_node.name)
    node_map[curr_node.name] = curr_node
    response = dns_query(domain_name, curr_node.ip_addr, sock)
    print(curr_node, response.is_authoritative)

    for record in response.an_records:
        node_map[record.name] = DNSNode(record.name, record.rdata)

    if response.is_authoritative:
        if len(response.an_records) > 0:
            return node_map[response.an_records[0].name]
        else:
            print(response.an_records)

    for record in response.ar_records:
        if record.rtype == 1 or record == 28:
            node_map[record.name] = DNSNode(record.name, record.rdata)

    for record in response.ns_records:
        if record.rtype != 2 or record.rdata not in node_map:
            continue
        ns_node = node_map[record.rdata]
        if ns_node.name in visited_names:
            continue
        answer = dns_lookup(ns_node, domain_name, node_map, visited_names, sock)
        if answer:
            return answer

    for record in response.ns_records:
        if record.rtype != 2 or record.rdata in node_map:
            continue
        ns_answer = dns_lookup(node_map["root"], record.rdata, node_map, set(), sock)
        if ns_answer is None:
            continue
        if ns_answer.name in visited_names:
            continue
        answer = dns_lookup(ns_answer, domain_name, node_map, visited_names, sock)
        if answer:
            return answer

    return None
