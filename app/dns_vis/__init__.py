from ..base_blueprint import BaseBlueprint

dns_vis = BaseBlueprint("dns_vis", __name__)

from . import routes
