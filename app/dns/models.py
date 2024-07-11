from typing import Optional
from dataclasses import dataclass

@dataclass
class ResourceRecord:
    name: str
    rtype: int
    rdata: str

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
    an_records: Optional[list[ResourceRecord]] = None
    ns_records: Optional[list[ResourceRecord]] = None
    ar_records: Optional[list[ResourceRecord]] = None

@dataclass
class DNSLookupResult:
    answer: Optional[str]
    nodes: list[DNSNode]
    referrals: dict[str, str]
