from ..base_blueprint import BaseBlueprint

webhook = BaseBlueprint("webhook", __name__)

from . import routes
