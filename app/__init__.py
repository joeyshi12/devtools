from flask import Flask, Response, render_template
from waitress import serve

def create_app() -> Flask:
    app = Flask(__name__)
    from app.webhook.routes import bp as webhook_bp
    from app.jdtt.routes import bp as jdtt_bp
    from app.dbvis.routes import bp as dbvis_bp
    app.register_blueprint(webhook_bp, url_prefix="/webhook")
    app.register_blueprint(jdtt_bp, url_prefix="/jdtt")
    app.register_blueprint(dbvis_bp, url_prefix="/dbvis")

    @app.route("/")
    def index() -> Response:
        return Response(render_template("index.html"))

    @app.errorhandler(404)
    def page_not_found(e: Exception) -> Response:
        return Response(render_template("404.html"), 404)

    return app
