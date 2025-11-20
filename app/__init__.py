import os
import logging
from flask import Flask, Response, render_template
from flask_session import Session
from .webhook import webhook_blueprint
from .jdtt import jdtt_blueprint
from .dns_vis import dns_vis_blueprint

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
    format="[%(asctime)s] %(levelname)s (%(name)s:%(lineno)d) — %(message)s",
)
logging.getLogger("waitress").setLevel(logging.INFO)
logger = logging.getLogger(__name__)

def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.urandom(24)
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_TYPE"] = "filesystem"
    Session(app)

    app.register_blueprint(webhook_blueprint, url_prefix="/webhook")
    app.register_blueprint(jdtt_blueprint, url_prefix="/jdtt")
    app.register_blueprint(dns_vis_blueprint, url_prefix="/dns_vis")

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
        logger.error(e, stack_info=True, exc_info=True)
        return render_template("500.html", title="Internal Server Error | Devtools"), 500

    return app
