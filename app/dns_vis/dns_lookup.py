import socket
from typing import Optional
from .dns_query import dns_query
from .models import DNSNode

ROOT_NAME = "root"


class DNSLookup:
    def __init__(self, root_ip: str):
        self.node_map = {ROOT_NAME: DNSNode(ROOT_NAME, root_ip)}
        self.referrals = {}

    def get_connected_nodes(self) -> list[DNSNode]:
        node_names = set()
        for name, targets in self.referrals.items():
            if name in self.node_map:
                node_names.add(name)
            for target in targets:
                if target in self.node_map:
                    node_names.add(target)

        return [self.node_map[name] for name in node_names]

    def lookup(self, domain_name: str, sock: socket.socket) -> Optional[DNSNode]:
        return self.__lookup(self.node_map[ROOT_NAME], domain_name, set(), sock)

    def __lookup(self,
                 curr_node: DNSNode,
                 domain_name: str,
                 visited_names: set[str],
                 sock: socket.socket) -> Optional[DNSNode]:
        visited_names.add(curr_node.name)
        self.node_map[curr_node.name] = curr_node
        print(domain_name, curr_node)
        response = dns_query(domain_name, curr_node.ip_addr, sock)
        curr_node.an_records = response.an_records
        curr_node.ns_records = response.ns_records
        curr_node.ar_records = response.ar_records

        for record in response.an_records:
            self.node_map[record.name] = DNSNode(record.name, record.rdata)

        if len(response.an_records) > 0:
            return self.node_map[response.an_records[0].name]

        for record in response.ar_records:
            if record.rtype != 1:
                continue
            if record.name not in self.node_map:
                self.node_map[record.name] = DNSNode(record.name, record.rdata)

        for record in response.ns_records:
            if record.rtype != 2:
                continue
            ns_node = self.node_map[record.rdata] \
                if record.rdata in self.node_map \
                else self.__lookup(self.node_map[ROOT_NAME], record.rdata, set(), sock)
            if ns_node is None or ns_node.name in visited_names:
                continue
            if curr_node.name in self.referrals:
                self.referrals[curr_node.name].append(ns_node.name)
            else:
                self.referrals[curr_node.name] = [ns_node.name]
            answer = self.__lookup(ns_node, domain_name, visited_names, sock)
            if answer:
                return answer

        return None
