import os
import logging
from datetime import datetime
from flask import Flask, Response, render_template
from flask_session import Session
from .webhook import webhook
from .jdtt import jdtt
from .dns_vis import dns_vis


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_TYPE"] = "filesystem"
    Session(app)

    app.register_blueprint(webhook, url_prefix="/webhook")
    app.register_blueprint(jdtt, url_prefix="/jdtt")
    app.register_blueprint(dns_vis, url_prefix="/dns_vis")

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
        return render_template("index.html", title="Devtools")

    @app.route("/pql_compiler")
    def pql_compiler() -> Response:
        return render_template("pql_compiler.html", title="PQL Compiler")

    @app.errorhandler(404)
    def page_not_found(e: Exception) -> Response:
        return render_template("404.html", title="Page Not Found | Devtools"), 404

    @app.errorhandler(Exception)
    def internal_server_error(e: Exception) -> Response:
        logger.error("Internal server error: %s", e)
        return render_template("500.html", title="Internal Server Error | Devtools"), 500

    return app
