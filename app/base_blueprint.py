from flask import Blueprint


# Blueprint class that registers route with and without trailing slash to avoid 301 redirects
# https://gist.github.com/hodgesmr/2db123b4e1bd8dcca5c4
class BaseBlueprint(Blueprint):
    def route(self, rule, **options):
        """Override the `route` method; add rules with and without slash."""
        def decorator(f):
            new_rule = rule.rstrip('/')
            new_rule_with_slash = '{}/'.format(new_rule)
            super(BaseBlueprint, self).route(new_rule, **options)(f)
            super(BaseBlueprint, self).route(new_rule_with_slash, **options)(f)
            return f
        return decorator
