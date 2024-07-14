export interface ResourceRecord {
    name: string;
    rtype: number;
    rdata: string;
}

export interface DNSNode {
    name: string;
    ip_addr: string;
    an_records: ResourceRecord[] | null;
    ns_records: ResourceRecord[] | null;
    ar_records: ResourceRecord[] | null;
}

export interface DNSLookupResult {
    answer: string | null;
    nodes: DNSNode[];
    referrals: Record<string, string[]>;
}

