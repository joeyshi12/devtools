import logging
from flask import Blueprint, Response, render_template, request
import mysql.connector

bp = Blueprint("dbvis", __name__)
logger = logging.getLogger("waitress")

@bp.route("/")
def index() -> Response:
    return Response(render_template("dbvis.html"))

@bp.route("/tables", methods=["POST"])
def fetch_tables() -> Response:
    try:
        body = request.get_json()
        host = str(body["host"])
        port = int(body["port"])
        name = str(body["database"])
        user = str(body["user"])
        password = str(body["password"])
        connection = mysql.connector.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database=name
        )
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        table_names = [row[0] for row in cursor.fetchall()]
        logger.info("Fetched tables %s", ",".join(table_names))
        tables = {}
        for name in table_names:
            cursor.execute(f"SELECT * FROM {name}")
            tables[name] = cursor.fetchall()
        connection.close()
        return tables, 200
    except Exception as e:
        logger.error(e)
        return {"msg": "Failed to fetch tables"}, 500