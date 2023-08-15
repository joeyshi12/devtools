document.getElementById("dbvis-submit").addEventListener("click", function(event) {
    const host = document.getElementById("host").value;
    const port = document.getElementById("port").value;
    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;
    const database = document.getElementById("database").value;
    const body = { host, port, user, password, database };
    fetch("/dbvis/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).then(function(response) {
        console.log(response);
    })
});
