from flask import redirect, session
from flask_app.models.user import User


def authorize_view(as_admin=False, as_id=None, anonymous_to="/", unauthorized_to="/dashboard"):
    def decorator(render):
        def policy(*args, **kwargs):
            if "user_id" not in session:
                print("not authenticated!")
                return redirect(anonymous_to)

            if as_id is not None and session["user_id"] != as_id:
                print(f"user id invalid: expected {as_id}, got {session['user_id']}")
                return redirect(unauthorized_to)

            user = User.get_by_id(session["user_id"])

            if as_admin is True:
                if not user.is_admin:
                    print("user is not admin!")
                    return redirect(unauthorized_to)

            kwargs["user"] = user
            return render(*args, **kwargs)

        return policy

    return decorator
