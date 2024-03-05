import json
import logging
from typing import Optional
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
        date_format = _get_date_pattern(request.form["dateFormat"])
        sanitize_symbols = "sanitizeSymbols" in request.form
        schema_json = json.loads(request.form["jsonString"])

        if not isinstance(schema_json, dict):
            message = "Not a JSON object literal"
            logger.error(message)
            return Response(message, 400, mimetype="utf-8")

        result = transcompile(schema_json, target_language, date_format, "Schema", sanitize_symbols)
        logger.info("Transcompiled JSON object to %s [date_format=%s] [sanitize_symbols=%s]",
                    target_language, date_format, sanitize_symbols)
        return Response(result, 200, mimetype="utf-8")

    except Exception as e:
        message = "Failed to transcompile JSON object"
        logger.error(message, e)
        return Response(message, 500, mimetype="utf-8")


def _get_date_pattern(date_format_option: str) -> Optional[str]:
    # https://www.ibm.com/docs/en/i/7.4?topic=design-date-formats
    match date_format_option:
        case "ISO":
            return r"\d{4}-\d{2}-\d{2}"
        case "USA":
            return r"\d{2}-\d{2}-\d{4}"
        case "EUR":
            return r"\d{2}\.\d{2}\.\d{4}"
        case _:
            return None
