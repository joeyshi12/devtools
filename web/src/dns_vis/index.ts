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
    if (!domain) {
        alert("Missing domain.");
        return;
    }
    const lookupResult = await fetchLookupResult(domain);
    renderLookupGraph(lookupResult);
});

async function fetchLookupResult(domain: string) {
    let uri = `/dns_vis/query?name=${domain}`;
    const response = await fetch(uri);
    return await response.json();
}

function renderLookupGraph(lookupResult: DNSLookupResult): void {
    if (lookupResult.nodes.length === 0) {
        alert("Invalid domain.");
        return;
    }

    svg.call(<any>zoom.transform, d3Zoom.zoomIdentity);
    const graph = createDagreGraph(lookupResult);

    // @ts-ignore
    const render = new dagreD3.render();
    render(inner, graph);

    inner.selectAll("g.node")
        .on("mouseenter", (event: MouseEvent, nodeName: string) => {
            const node = lookupResult.nodes.find(node => node.name === nodeName);
            if (!node || node?.records?.length === 0) {
                return;
            }
            const tableElement: HTMLTableElement = createRecordTable(node.records);
            d3Select.select("#tooltip")
                .style("display", "block")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`)
                .html(tableElement.outerHTML);
        })
        .on("mousemove", (event: MouseEvent) => {
            d3Select.select("#tooltip")
                .style("display", "block")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
        })
        .on("mouseleave", () => {
            d3Select.select("#tooltip").style("display", "none");
        })
        .on("mousedown", () => {
            d3Select.select("#tooltip").style("display", "none");
        });

    const svgBox = (svg.node() as SVGSVGElement).getBoundingClientRect();
    const groupBox = (inner.node() as SVGGElement).getBoundingClientRect();
    const translateX = (svgBox.width - groupBox.width) / 2;
    const transform = d3Zoom.zoomIdentity.translate(translateX, 0);
    svg.call(<any>zoom.transform, transform);
}

function createDagreGraph(lookupResult: DNSLookupResult): dagreD3.graphlib.Graph {
    const graph = new dagreD3.graphlib.Graph({ multigraph: true }).setGraph({});
    graph.graph().marginy = 20;

    for (let node of lookupResult.nodes) {
        const nodeHtml = document.createElement("div")
        const selection = d3Select.select(nodeHtml);
        selection.append("label").text(node.name);
        selection.append("p").text(node.ip_addr);
        const graphNode: any = { label: nodeHtml, rx: 5, ry: 5 };
        if (lookupResult.answer && node.records.some(record => record.rdata === lookupResult.answer)) {
            graphNode.class = "authoritative";
        }
        graph.setNode(node.name, graphNode);
    }

    for (let i = 0; i < lookupResult.referrals.length; i++) {
        const referral = lookupResult.referrals[i];
        graph.setEdge(referral.source, referral.target, { label: `${referral.query_domain}, ${i}` }, i.toString());
    }

    return graph;
}

function getInputValue(id: string): string {
    const textInput = <HTMLInputElement>document.getElementById(id);
    return textInput.value;
}

function createRecordTable(records: ResourceRecord[]): HTMLTableElement {
    const table = document.createElement("table");
    const tableSelection = d3Select.select(table);

    const headRow = tableSelection.append("thead").append("tr");
    headRow.append("td").text("Name");
    headRow.append("td").text("Type");
    headRow.append("td").text("Data");

    const tableBody = tableSelection.append("tbody");
    for (let record of records) {
        const row = tableBody.append("tr");
        row.append("td").text(record.name);
        row.append("td").text(record.rtype);
        row.append("td").text(record.rdata);
    }

    return table;
}

fetchLookupResult("www.example.com").then((lookupResult: DNSLookupResult) => {
    renderLookupGraph(lookupResult);
});
