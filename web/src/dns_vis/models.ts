export interface ResourceRecord {
    name: string;
    rtype: number;
    rdata: string;
}

export interface DNSNode {
    name: string;
    ip_addr: string;
    records: ResourceRecord[];
}

export interface DNSReferral {
    source: string;
    target: string;
    query_domain: string;
}

export interface DNSLookupResult {
    answer: string | null;
    nodes: DNSNode[];
    referrals: DNSReferral[];
}

