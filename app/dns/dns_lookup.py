import socket
import struct
import base64
import random
from .models import DNSNode, DNSQueryResponse, ResourceRecord

MAX_RECV_ITS = 4


def dns_lookup(curr_node: DNSNode,
               domain_name: str,
               node_map: dict[str, DNSNode],
               node_referrals: dict[str, list[str]],
               visited_names: set[str],
               sock: socket.socket):
    visited_names.add(curr_node.name)
    node_map[curr_node.name] = curr_node
    response = dns_query(domain_name, curr_node.ip_addr, sock)
    curr_node.an_records = response.an_records
    curr_node.ns_records = response.ns_records
    curr_node.ar_records = response.ar_records

    for record in response.an_records:
        node_map[record.name] = DNSNode(record.name, record.rdata)

    if len(response.an_records) > 0:
        return node_map[response.an_records[0].name]

    for record in response.ar_records:
        if record.rtype == 1 or record == 28:
            node_map[record.name] = DNSNode(record.name, record.rdata)

    for record in response.ns_records:
        if record.rtype != 2:
            continue
        ns_node = node_map[record.rdata] \
            if record.rdata in node_map \
            else dns_lookup(node_map["root"], record.rdata, node_map, node_referrals, set(), sock)
        if ns_node.name in visited_names:
            continue
        if curr_node.name in node_referrals:
            node_referrals[curr_node.name].append(ns_node.name)
        else:
            node_referrals[curr_node.name] = [ns_node.name]
        answer = dns_lookup(ns_node, domain_name, node_map, node_referrals, visited_names, sock)
        if answer:
            return answer

    return None


def dns_query(domain_name: str, name_server_ip: str, sock: socket.socket) -> DNSQueryResponse:
    query = build_query(domain_name)
    sock.sendto(query, (name_server_ip, 53))

    response = None
    for _ in range(MAX_RECV_ITS):
        response = sock.recv(512)
        if response[:2] == query[:2]:
            break

    if response is None or response[:2] != query[:2]:
        raise Error(f"No response received from name server {name_server_ip}")

    return decode_response(response)


def build_query(domain_name: str) -> bytes:
    query = bytearray()
    packet_id = random.randbytes(2)
    query.extend(packet_id)
    query.append(0)             # QR opcode AA TC RD
    query.append(0)             # RA Z RCODE
    query.extend(b"\x00\x01")   # Query count
    query.extend(b"\x00\x00")   # Answer count
    query.extend(b"\x00\x00")   # Name server records
    query.extend(b"\x00\x00")   # Additional record count

    for label in domain_name.split("."):
        query.append(len(label) & 0xff)
        query.extend(bytes(label, "ascii"))

    query.append(0)             # End of QName
    query.extend(b"\x00\x01")   # QTYPE
    query.extend(b"\x00\x01")   # QCLASS
    return query


def decode_response(response: bytes) -> DNSQueryResponse:
    response_id = struct.unpack(">H", response[:2])[0]
    an_count, ns_count, ar_count = struct.unpack(">HHH", response[6:12])
    name_bytes, offset = read_name(response, 12)
    offset += 4

    an_records = []
    for _ in range(an_count):
        record, offset = read_resource_record(response, offset)
        an_records.append(record)

    ns_records = []
    for _ in range(ns_count):
        record, offset = read_resource_record(response, offset)
        ns_records.append(record)

    ar_records = []
    for _ in range(ar_count):
        record, offset = read_resource_record(response, offset)
        ar_records.append(record)

    return DNSQueryResponse(
        response_id,
        name_bytes.decode("ascii"),
        an_records,
        ns_records,
        ar_records
    )


def read_resource_record(buf: bytes, offset: int) -> tuple[ResourceRecord, int]:
    name, offset = read_name(buf, offset)
    rtype, rclass, ttl, rdlength = struct.unpack(">HHiH", buf[offset:offset + 10])
    offset += 10
    rdata = None
    match rtype:
        case 1:
            assert rdlength == 4
            rdata = ".".join([str(num) for num in buf[offset:offset + 4]])
        case 2 | 5:
            value_bytes, next_offset = read_name(buf, offset)
            rdata = value_bytes.decode("ascii")
            assert next_offset - offset == rdlength
        case 28:
            assert rdlength == 16
            hex_groups = []
            encoded_buf = base64.b16encode(buf[offset:offset + 16]).decode("ascii")
            for i in range(8):
                hex_groups.append(encoded_buf[4 * i:4 * (i + 1)])
            rdata = ":".join(hex_groups)

    offset += rdlength
    return ResourceRecord(name.decode("ascii"), rtype, rdata), offset


def read_name(buf: bytes, offset: int) -> tuple[str, int]:
    resource_bytes = bytearray()
    current_byte = buf[offset]
    offset += 1
    remaining_chars = 0
    while current_byte != 0:
        if ((current_byte & 0xc0) == 0xc0 or remaining_chars == 0) and len(resource_bytes) > 0:
            resource_bytes.append(0x2e)

        if ((current_byte & 0xc0) == 0xc0):
            name_offset = ((current_byte & 0x3f) << 4) + buf[offset]
            offset += 1
            label_bytes, _ = read_name(buf, name_offset)
            resource_bytes.extend(label_bytes)
            return resource_bytes, offset

        if (remaining_chars == 0):
            remaining_chars = current_byte
        else:
            resource_bytes.append(current_byte)
            remaining_chars -= 1

        current_byte = buf[offset]
        offset += 1

    return resource_bytes, offset
