import socket
from typing import Optional
from .dns_query import dns_query
from .models import DNSLookupTrace, DNSReferral, ResourceRecord, DNSNode

ROOT_NAME = "root"
MAX_INDIRECTIONS = 4
MAX_REFERRALS = 4


def dns_lookup_trace(domain_name: str, root_ip: str, sock: socket.socket) -> DNSLookupTrace:
    name_to_ip: dict[str, str] = {ROOT_NAME: root_ip}
    name_to_records: dict[str, list[ResourceRecord]] = {}
    referrals: list[DNSReferral] = []

    def lookup(curr_name: str, domain_name: str, visited_names: set[str], remaining_indirections: int) -> Optional[str]:
        """Returns data from any record for the given query"""
        visited_names.add(curr_name)
        if remaining_indirections == 0:
            return None

        for record in name_to_records.get(curr_name, []):
            if record.name == domain_name:
                return record.rdata

        response = dns_query(domain_name, name_to_ip[curr_name], sock)

        if curr_name not in name_to_records:
            name_to_records[curr_name] = []

        name_to_records[curr_name].extend(response.an_records)
        name_to_records[curr_name].extend(response.ns_records)
        name_to_records[curr_name].extend(response.ar_records)

        for record in response.an_records:
            if record.rdata:
                name_to_ip[record.name] = record.rdata
                return record.rdata

        for record in response.ar_records:
            if record.rdata is not None and record.rtype == 1 and record.name not in name_to_ip:
                name_to_ip[record.name] = record.rdata
            if record.name == domain_name:
                return record.rdata

        for i, record in enumerate(response.ns_records):
            if i == MAX_REFERRALS:
                break
            if record.rtype != 2 or record.rdata is None:
                continue
            ns_name = record.rdata
            ns_addr = name_to_ip[ns_name] \
                if record.rdata in name_to_ip \
                else lookup(ROOT_NAME, record.rdata, set(), remaining_indirections - 1)
            if ns_addr is None or ns_name in visited_names:
                continue
            referrals.append(DNSReferral(curr_name, ns_name, domain_name))
            answer = lookup(ns_name, domain_name, visited_names, remaining_indirections)
            if answer:
                return answer

        return None

    answer = lookup(ROOT_NAME, domain_name, set(), MAX_INDIRECTIONS)
    nodes = __to_nodes(domain_name, name_to_ip, name_to_records, referrals)
    return DNSLookupTrace(answer, nodes, referrals)


def __to_nodes(domain_name: str,
               name_to_ip: dict[str, str],
               name_to_records: dict[str, list[ResourceRecord]],
               referrals: list[DNSReferral]) -> list[DNSNode]:
    names_set = set()
    for referral in referrals:
        names_set.add(referral.source)
        names_set.add(referral.target)

    nodes = []
    for name in names_set:
        ip_addr = name_to_ip.get(name)
        records = name_to_records.get(name)
        if ip_addr is None or records is None:
            continue
        filtered_records = [
            record for record in records
            if (record.name in names_set and record.rtype == 1)
            or (record.rdata in names_set and record.rtype == 2)
            or record.name == domain_name
        ]
        filtered_records.sort(key=lambda record: record.rtype)
        node = DNSNode(name, ip_addr, filtered_records)
        nodes.append(node)

    return nodes
