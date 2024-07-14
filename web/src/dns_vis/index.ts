import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as dagreD3 from 'dagre-d3-es';
import { DNSLookupResult, ResourceRecord } from './models';

const svg = d3Select.select("svg")
const inner = d3Select.select("g")
const zoom = d3Zoom.zoom().on("zoom", (event: any) => {
    inner.attr("transform", event.transform);
});
svg.call(zoom);

document.getElementById("lookup-button").addEventListener("click", async () => {
    const domain = getInputValue("domain");
    const rootServer = getInputValue("root-server");
    if (!domain || domain.length === 0) {
        alert("Missing domain.");
        return;
    }
    const lookupResult = await fetchLookupResult(domain, rootServer);
    renderDnsGraph(lookupResult);
});

async function fetchLookupResult(domain: string, rootServer?: string) {
    let uri = `/dns_vis/query?name=${domain}`;
    if (rootServer && rootServer.length > 0) {
        uri = uri + `&root=${rootServer}`;
    }
    const response = await fetch(uri);
    return await response.json();
}

function renderDnsGraph(lookupResult: DNSLookupResult) {
    if (lookupResult.nodes.length === 0) {
        alert("Invalid domain.");
        return;
    }
    const graph = new dagreD3.graphlib.Graph({ multigraph: true }).setGraph({});
    graph.graph().marginy = 20;

    for (let node of lookupResult.nodes) {
        const graphNode: any = {
            label: () => {
                const div = document.createElement("div");
                div.innerHTML = `
                    <label>${node.name}</label>
                    <p>${node.ip_addr}</p>
                `;
                return div;
            },
            rx: 5,
            ry: 5,
        };
        if (lookupResult.answer && node.records.some(record => record.rdata === lookupResult.answer)) {
            graphNode.class = "authoritative";
        }
        graph.setNode(node.name, graphNode);
    }

    for (let i = 0; i < lookupResult.referrals.length; i++) {
        const referral = lookupResult.referrals[i];
        const edgeId = `${referral.source}_${referral.target}_${referral.query_domain}`;
        graph.setEdge(referral.source, referral.target, { label: `${referral.query_domain}, ${i}` }, edgeId);
    }

    svg.call(<any>zoom.transform, d3Zoom.zoomIdentity);

    // @ts-ignore
    const render = new dagreD3.render();
    render(inner, graph);

    const nodeMap = new Map(lookupResult.nodes.map(node => [node.name, node]));
    inner.selectAll("g.node")
        .on("mousemove", (event: MouseEvent, nodeName: string) => {
            const node = nodeMap.get(nodeName);
            if (!node || node?.records?.length === 0) {
                return;
            }
            const tableString = createRecordTableString(node.records);
            d3Select.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px')
                .html(tableString);
        })
        .on("mouseleave", () => {
            d3Select.select("#tooltip").style("display", "none");
        })
        .on("mousedown", () => {
            d3Select.select("#tooltip").style("display", "none");
        });

    const svgBox = (svg.node() as SVGSVGElement).getBoundingClientRect();
    const groupBox = (inner.node() as SVGGElement).getBoundingClientRect();
    const x = (svgBox.width - groupBox.width) / 2;
    const transform = d3Zoom.zoomIdentity.translate(x, 0);
    svg.call(<any>zoom.transform, transform);
}

function getInputValue(id: string): string {
    const textInput = <HTMLInputElement>document.getElementById(id);
    return textInput.value;
}

function createRecordTableString(records: ResourceRecord[]): string {
    const rows = records.map((record: ResourceRecord) => `
        <tr>
            <td>${record.name}</td>
            <td>${record.rtype}</td>
            <td>${record.rdata ?? "----"}</td>
        </tr>
    `);
    return `
        <table>
            <thead>
                <tr>
                    <td>Name</td>
                    <td>Type</td>
                    <td>Data</td>
                </tr>
            </thead>
            <tbody>
                ${rows.join("")}
            </tbody>
        </table>
    `;
}

fetchLookupResult("www.example.com").then((lookupResult: any) => {
    renderDnsGraph(lookupResult);
});
