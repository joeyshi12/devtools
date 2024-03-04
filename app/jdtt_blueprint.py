import json
import logging
from flask import Blueprint, Response, render_template, request
from jdtt.transcompilation import transcompile

jdtt_blueprint = Blueprint("jdtt", __name__)
logger = logging.getLogger("waitress")


@jdtt_blueprint.route("/")
def index() -> Response:
    return Response(render_template("jdtt.html"))


@jdtt_blueprint.route("/transcompile", methods=["POST"])
def transcompile_schema() -> Response:
    try:
        target_language = request.form["targetLanguage"]
        detect_dates = request.form["detectDates"] == "on"
        schema_json = json.loads(request.form["schemaText"])
        date_format = r"\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?(\.\d{3})?Z" if detect_dates else None
        result = transcompile(schema_json, target_language, date_format, "Schema")
        logger.info("Transcompiled JSON object to %s", target_language)
        return Response(result, 200, mimetype="utf-8")
    except Exception as e:
        logger.error("Failed to transpile JSON object", e)
        return Response("Failed to transpile JSON object", 500, mimetype="utf-8")
