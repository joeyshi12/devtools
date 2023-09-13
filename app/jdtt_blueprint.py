import json
import logging
from flask import Blueprint, Response, render_template, request
from jdtt.conversion import json_to_language_str, TargetLanguage

jdtt_blueprint = Blueprint("jdtt", __name__)
logger = logging.getLogger("waitress")


@jdtt_blueprint.route("/")
def index() -> Response:
    return Response(render_template("jdtt.html"))


@jdtt_blueprint.route("/transcompile", methods=["POST"])
def transcompile_schema() -> Response:
    try:
        target_language = TargetLanguage[request.form["targetLanguage"]]
        detect_dates = request.form["detectDates"] == "on"
        schema = json.loads(request.form["schemaText"])
        json_target_language_str = json_to_language_str(
            schema, target_language, "Root", detect_date=detect_dates)
        logger.info("Transcompiled schema to %s", target_language.name)
        return Response(json_target_language_str, 200, mimetype="utf-8")
    except Exception as e:
        logger.error("Failed to transpile schema", e)
        return Response("Invalid JSON Object", 500, mimetype="utf-8")
