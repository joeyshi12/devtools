import os
import logging
from datetime import datetime
from flask import Flask, Response, render_template
from flask_session import Session
from app.webhook_blueprint import webhook_blueprint
from app.jdtt_blueprint import jdtt_blueprint


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_TYPE"] = "filesystem"
    Session(app)

    app.register_blueprint(webhook_blueprint, url_prefix="/webhook")
    app.register_blueprint(jdtt_blueprint, url_prefix="/jdtt")

    os.makedirs("logs", exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler("logs/{:%Y-%m-%d}.log".format(datetime.now())),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger("waitress")

    @app.route("/")
    def index() -> Response:
        return Response(render_template("index.html"))

    @app.route("/json-vis")
    def json_vis() -> Response:
        return Response(render_template("json_vis.html"))

    @app.errorhandler(404)
    def page_not_found(e: Exception) -> Response:
        return Response(render_template("404.html"), 404)

    @app.errorhandler(Exception)
    def internal_server_error(e: Exception) -> Response:
        logger.error("Internal server error: %s", e)
        return Response(render_template("500.html"), 500)

    return app
