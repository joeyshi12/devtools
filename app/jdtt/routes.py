import json
import logging
from typing import Optional
from flask import Response, render_template, request
from jdtt.transcompilation import transcompile
from jdtt.exceptions import JDTTException
from ..base_blueprint import BaseBlueprint

jdtt_blueprint = BaseBlueprint("jdtt", __name__)
logger = logging.getLogger(__name__)


@jdtt_blueprint.route("/")
def index():
    return render_template("jdtt.html", title="JSON Data Type Transcompiler")


@jdtt_blueprint.route("/transcompile", methods=["POST"])
def transcompile_schema():
    try:
        target_language = request.form["targetLanguage"]
        date_format = _get_date_pattern(request.form["dateFormat"])
        sanitize_symbols = "sanitizeSymbols" in request.form
        schema_json = json.loads(request.form["jsonString"])
        result = transcompile(schema_json, target_language, date_format, "Schema", sanitize_symbols)
        logger.info("Transcompiled JSON object to %s [date_format=%s] [sanitize_symbols=%s]",
                    target_language, date_format, sanitize_symbols)
        return Response(result, 200, mimetype="utf-8")
    except json.decoder.JSONDecodeError as e:
        message = f"Invalid JSON object: {e}"
        logger.exception(message)
        return Response(message, 400, mimetype="utf-8")
    except JDTTException as e:
        message = f"jdtt: {e}"
        logger.exception(message)
        return Response(message, 500, mimetype="utf-8")
    except Exception as e:
        message = "Failed to transcompile JSON object"
        logger.exception(message)
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
