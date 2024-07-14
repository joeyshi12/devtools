import socket
from typing import Optional
from .dns_query import dns_query
from .models import DNSLookupTrace, ResourceRecord, DNSNode

ROOT_NAME = "root"


def dns_lookup_trace(domain_name: str,
                     root_ip: str,
                     sock: socket.socket) -> DNSLookupTrace:
    name_to_ip: dict[str, str] = {ROOT_NAME: root_ip}
    name_to_records: dict[str, list[ResourceRecord]] = {}
    name_to_referrals: dict[str, list[str]] = {}

    def lookup(curr_name: str,
               domain_name: str,
               visited_names: set[str]) -> Optional[str]:
        """Returns data from any record for the given query"""
        visited_names.add(curr_name)
        response = dns_query(domain_name, name_to_ip[curr_name], sock)
        if curr_name not in name_to_records:
            name_to_records[curr_name] = []
        name_to_records[curr_name].extend(response.an_records)
        name_to_records[curr_name].extend(response.ns_records)
        name_to_records[curr_name].extend(response.ar_records)

        for record in response.an_records:
            if record.rtype == 1:
                name_to_ip[record.name] = record.rdata

        if len(response.an_records) > 0:
            return response.an_records[0].rdata

        for record in response.ar_records:
            if record.rtype == 1 and record.name not in name_to_ip:
                name_to_ip[record.name] = record.rdata

        for record in response.ns_records:
            if record.rtype != 2:
                continue
            ns_name = record.rdata
            ns_addr = name_to_ip[ns_name] \
                if record.rdata in name_to_ip \
                else lookup(ROOT_NAME, record.rdata, set())
            if ns_addr is None or ns_name in visited_names:
                continue
            if curr_name not in name_to_referrals:
                name_to_referrals[curr_name] = []
            name_to_referrals[curr_name].append(ns_name)
            answer = lookup(ns_name, domain_name, visited_names)
            if answer:
                return answer

        return None

    answer = lookup(ROOT_NAME, domain_name, set())
    nodes = __to_nodes(domain_name, name_to_ip, name_to_records, name_to_referrals)
    return DNSLookupTrace(answer, nodes, name_to_referrals)


def __to_nodes(domain_name: str,
               name_to_ip: dict[str, str],
               name_to_records: dict[str, list[ResourceRecord]],
               name_to_referrals: dict[str, str]) -> list[DNSNode]:
    names_set = set()
    for name, referrals in name_to_referrals.items():
        names_set.add(name)
        for referral in referrals:
            names_set.add(referral)

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
