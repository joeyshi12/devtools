from ..base_blueprint import BaseBlueprint

dns = BaseBlueprint("dns", __name__)

from . import routes
