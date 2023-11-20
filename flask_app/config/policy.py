from flask import redirect, session, flash
from flask_app.models.user import User


def get_value(obj, key: str):
    return int(obj.get(key)) if isinstance(obj, dict) else obj


def parse_property_parameter(item, route: str) -> str:
    parameter_start = route.find(":")
    parameter_end = parameter_start + 1
    while parameter_end < len(route) and route[parameter_end] != "/":
        parameter_end += 1
    parameter = route[parameter_start + 1:parameter_end]

    parameter_value = getattr(item, parameter, None)

    return \
        route[:parameter_start:] \
        + str(parameter_value) \
        + route[parameter_end + 1::]


def parse_form_parameter(arg, route: str) -> str:
    parameter_start = route.find("[")
    parameter_end = route.find("]")
    parameter = route[parameter_start + 1:parameter_end]

    parameter_value = get_value(arg, parameter)

    return \
        route[:parameter_start:] \
        + str(parameter_value) \
        + route[parameter_end + 1::]


def authorize_action(as_admin=False,
                     as_owner=False,
                     as_self=False,
                     anonymous_to="/",
                     unauthorized_to="/dashboard",
                     error_handler=redirect):

    def decorator(endpoint):
        def policy(*args, **kwargs):
            _unauthorized_to = unauthorized_to
            if "[" in unauthorized_to:
                _unauthorized_to = parse_form_parameter(args[1], unauthorized_to)

            _anonymous_to = anonymous_to
            if "[" in anonymous_to:
                _anonymous_to = parse_form_parameter(args[1], anonymous_to)

            if "user_id" not in session:
                flash("Please login to use this feature", "error")
                return error_handler(_anonymous_to)

            auth_user = User.get_by_id(session["user_id"])
            kwargs["auth_user"] = auth_user
            authorized = True

            if as_owner is True:
                controller = args[0]
                id = get_value(args[1], "id")
                item = controller.model.get_by_id(id)
                kwargs[controller.model.__name__.lower()] = item

            if not auth_user.is_admin:
                if as_admin is True:
                    authorized = False

                elif as_owner is True:
                    owner_id = getattr(item, "user_id", None)
                    if auth_user.id != owner_id:
                        authorized = False
                        if ":" in unauthorized_to:
                            _unauthorized_to = parse_property_parameter(item, unauthorized_to)

                elif as_self is True:
                    id = get_value(args[1], "id")
                    if auth_user.id != id:
                        authorized = False

            if authorized is False:
                flash("You are not authorized to activate this", "error")
                return error_handler(_unauthorized_to)

            return endpoint(*args, **kwargs)

        return policy

    return decorator
