import * as d3Select from 'd3-selection';
import * as dagreD3 from 'dagre-d3-es';
import { DNSLookupResult } from './models';


document.getElementById("lookup-button").addEventListener("click", async () => {
    const domain = getInputValue("domain");
    const rootServer = getInputValue("root-server");
    if (!domain || domain.length === 0) {
        alert("Missing domain.");
        return;
    }
    const lookupResult = await fetchLookupResult(domain, rootServer);
    renderDnsGraph(domain, lookupResult);
});

async function fetchLookupResult(domain: string, rootServer?: string) {
    let uri = `/dns/query?name=${domain}`;
    if (rootServer && rootServer.length > 0) {
        uri = uri + `&root=${rootServer}`;
    }
    const response = await fetch(uri);
    return await response.json();
}

function renderDnsGraph(domain: string, lookupResult: DNSLookupResult) {
    console.log(domain);
    const graph = new dagreD3.graphlib.Graph().setGraph({});

    for (let node of lookupResult.nodes) {
        const isAuthoritative = node.an_records.some(record => record.name === domain);
        const color = isAuthoritative ? "#8df5b0" : "#a9deff";
        graph.setNode(node.name, {
            label: () => {
                const div = document.createElement("div");
                div.innerHTML = `
                    <label>${node.name}</label>
                    <p>${node.ip_addr}</p>
                `;
                return div;
            },
            style: `fill: ${color}`,
            rx: 5,
            ry: 5,
        });
    }

    for (let name in lookupResult.referrals) {
        for (let targetName of lookupResult.referrals[name]) {
            graph.setEdge(name, targetName, {});
        }
    }

    const svg = d3Select.select("svg");
    const inner = svg.select("g");

    // @ts-ignore
    const render = new dagreD3.render();
    render(inner, graph);

    const svgBox = (svg.node() as SVGSVGElement).getBoundingClientRect();
    const groupBox = (inner.node() as SVGGElement).getBoundingClientRect();
    const x = (svgBox.width - groupBox.width) / 2;
    inner.attr("transform", `translate(${x},10)`)
}

function getInputValue(id: string): string {
    const textInput = <HTMLInputElement>document.getElementById(id);
    return textInput.value;
}

fetchLookupResult("www.example.com").then((lookupResult: any) => {
    renderDnsGraph("www.example.com", lookupResult);
});
