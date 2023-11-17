from flask import redirect, session, flash
from flask_app.models.user import User


def authorize_view(as_admin=False, as_owner=False, as_self=False, anonymous_to="/", unauthorized_to="/dashboard"):
    def decorator(endpoint):
        def policy(*args, **kwargs):
            if "user_id" not in session:
                flash("Please login to use this feature", "error")
                return redirect(anonymous_to)

            user = User.get_by_id(session["user_id"])
            authorized = True

            if not user.is_admin:
                if as_admin is True:
                    authorized = False

                elif as_owner is True:
                    controller = args[0]
                    if isinstance(args[1], dict):
                        id = int(args[1].get("id"))
                    else:
                        id = args[1]
                    item = controller.model.get_by_id(id)
                    owner_id = getattr(item, "user_id", None)
                    if owner_id is not None and user.id != owner_id:
                        authorized = False
                    else:
                        kwargs[controller.model.__name__.lower()] = item

                elif as_self is True:
                    if isinstance(args[1], dict):
                        id = int(args[1].get("id"))
                    else:
                        id = args[1]
                    if user.id != id:
                        authorized = False

            if authorized is False:
                flash("You are not authorized to activate this", "error")
                return redirect(unauthorized_to)

            kwargs["user"] = user
            return endpoint(*args, **kwargs)

        return policy

    return decorator
