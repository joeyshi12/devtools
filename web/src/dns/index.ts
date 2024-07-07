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
    console.log(json);
});

function getInputValue(id: string): string {
    const textInput = <HTMLInputElement>document.getElementById(id);
    return textInput.value;
}

function renderGraph() {
    // Create a new directed graph
    var g = new dagreD3.graphlib.Graph().setGraph({});

    // States and transitions from RFC 793
    var states = [ "CLOSED", "LISTEN", "SYN RCVD", "SYN SENT",
                   "ESTAB", "FINWAIT-1", "CLOSE WAIT", "FINWAIT-2",
                   "CLOSING", "LAST-ACK", "TIME WAIT" ];

    // Automatically label each of the nodes
    states.forEach(function(state) { g.setNode(state, { label: state }); });

    // Set up the edges
    g.setEdge("CLOSED",     "LISTEN",     { label: "open" });
    g.setEdge("LISTEN",     "SYN RCVD",   { label: "rcv SYN" });
    g.setEdge("LISTEN",     "SYN SENT",   { label: "send" });
    g.setEdge("LISTEN",     "CLOSED",     { label: "close" });
    g.setEdge("SYN RCVD",   "FINWAIT-1",  { label: "close" });
    g.setEdge("SYN RCVD",   "ESTAB",      { label: "rcv ACK of SYN" });
    g.setEdge("SYN SENT",   "SYN RCVD",   { label: "rcv SYN" });
    g.setEdge("SYN SENT",   "ESTAB",      { label: "rcv SYN, ACK" });
    g.setEdge("SYN SENT",   "CLOSED",     { label: "close" });
    g.setEdge("ESTAB",      "FINWAIT-1",  { label: "close" });
    g.setEdge("ESTAB",      "CLOSE WAIT", { label: "rcv FIN" });
    g.setEdge("FINWAIT-1",  "FINWAIT-2",  { label: "rcv ACK of FIN" });
    g.setEdge("FINWAIT-1",  "CLOSING",    { label: "rcv FIN" });
    g.setEdge("CLOSE WAIT", "LAST-ACK",   { label: "close" });
    g.setEdge("FINWAIT-2",  "TIME WAIT",  { label: "rcv FIN" });
    g.setEdge("CLOSING",    "TIME WAIT",  { label: "rcv ACK of FIN" });
    g.setEdge("LAST-ACK",   "CLOSED",     { label: "rcv ACK of FIN" });
    g.setEdge("TIME WAIT",  "CLOSED",     { label: "timeout=2MSL" });

    // Set some general styles
    g.nodes().forEach(function(v) {
      var node = g.node(v);
      node.rx = node.ry = 5;
    });

    // Add some custom colors based on state
    g.node('CLOSED').style = "fill: #f77";
    g.node('ESTAB').style = "fill: #7f7";

    var svg = d3Select.select("svg"),
    inner = svg.select("g");

    // Create the renderer
    // @ts-ignore
    var render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, g);
}

renderGraph();
