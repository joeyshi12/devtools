import * as d3Select from 'd3-selection';
import * as dagreD3 from 'dagre-d3-es';


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
    let uri = `/dns/query?name=${domain}`;
    if (rootServer && rootServer.length > 0) {
        uri = uri + `&root=${rootServer}`;
    }
    const response = await fetch(uri);
    return await response.json();
}

function renderDnsGraph(json: any) {
    const graph = new dagreD3.graphlib.Graph().setGraph({});

    const nodeNames = new Set();
    for (let name in json.referrals) {
        for (let targetName of json.referrals[name]) {
            nodeNames.add(name);
            nodeNames.add(targetName);
            graph.setEdge(name, targetName, {});
        }
    }
    for (let name of Array.from(nodeNames)) {
        graph.setNode(name, { label: name });
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
    renderDnsGraph(lookupResult);
});
