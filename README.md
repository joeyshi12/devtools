# devtools

![docker-image.yml](https://github.com/joeyshi12/devtools/actions/workflows/docker-image.yml/badge.svg)

Custom tools made to aid in software development.

## Tools

### Webhook tester

An intermediary for inspecting request contents.
This intended to be used for debugging and testing webhooks.
Send a request to `/webhook/<webhook_id>/capture` to capture your request metadata.

- https://devtools.joeyshi.xyz/webhook

### DNS visualizer

A DNS lookup visualization tool that traces the search path for an iterative query.
You can inspect the name server hierarchy of any given domain.

- https://devtools.joeyshi.xyz/dns_vis

### JSON data type transcompiler

A web interface for [jdtt](https://github.com/joeyshi12/json-data-type-transcompiler),
a utility for generating model classes and interfaces from a JSON literal.

- https://devtools.joeyshi.xyz/jdtt

### PQL compiler

An online compiler for [PQL](https://github.com/joeyshi12/pql-parser),
a query language I made to generate 2D plots from tabular data.

- https://devtools.joeyshi.xyz/pql_compiler
