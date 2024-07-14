from typing import Optional
from dataclasses import dataclass


@dataclass
class ResourceRecord:
    name: str
    rtype: int
    rdata: Optional[str]


@dataclass
class DNSQueryResponse:
    id: int
    name: str
    an_records: list[ResourceRecord]
    ns_records: list[ResourceRecord]
    ar_records: list[ResourceRecord]


@dataclass
class DNSNode:
    name: str
    ip_addr: str
    records: list[ResourceRecord]


@dataclass
class DNSReferral:
    source: str
    target: str
    query_domain: str


@dataclass
class DNSLookupTrace:
    answer: Optional[str]
    nodes: list[DNSNode]
    referrals: list[DNSReferral]
