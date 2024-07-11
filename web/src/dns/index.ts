import * as d3Select from 'd3-selection';
import * as dagreD3 from 'dagre-d3-es';


document.getElementById("lookup-button").addEventListener("click", async () => {
    const domain = getInputValue("domain") ?? "www.example.com";
    const rootServer = getInputValue("root-server");
    const recordType = getInputValue("record-type");
    let uri = `/dns/query?name=${domain}`;
    if (rootServer) {
        uri = uri + `&root=${rootServer}`;
    }
    if (recordType) {
        uri = uri + `&type=${recordType}`;
    }
    const response = await fetch(uri);
    const json = await response.json();
    renderDnsGraph(json);
});

function getInputValue(id: string): string {
    const textInput = <HTMLInputElement>document.getElementById(id);
    return textInput.value;
}

function renderDnsGraph(json: any) {
    // Create a new directed graph
    var g = new dagreD3.graphlib.Graph().setGraph({});

    const nodeNames = new Set();
    for (let name in json.referrals) {
        for (let targetName of json.referrals[name]) {
            nodeNames.add(name);
            nodeNames.add(targetName);
            g.setEdge(name, targetName, {});
        }
    }

    for (let name of Array.from(nodeNames)) {
        g.setNode(name, { label: name });
    }

    console.log(g.nodes());
    console.log(g.edges());

    var svg = d3Select.select("svg"),
    inner = svg.select("g");

    // Create the renderer
    // @ts-ignore
    var render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, g);
}
