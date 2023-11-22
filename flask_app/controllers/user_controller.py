from flask import redirect, session, render_template, flash, request, abort
from flask_app.config.policy import authorize_action
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.user import User
from flask_app.models.cringe import Cringe
from flask_app import app


class UserController(ControllerBase):
    def __init__(self):
        super().__init__(User)

    def register_crud_routes(self):
        super().register_crud_routes()
        return self

    def register_user_auth_routes(self):
        @app.route("/login", methods=["POST"])
        def login():
            if "user_id" in session:
                return redirect("/")

            user_id = User.authenticate_to_id(request.form)
            if user_id is None:
                return redirect("/")

            session["user_id"] = user_id
            return redirect("/dashboard")

        @app.route("/dashboard")
        @authorize_action()
        def dashboard(auth_user):
            if auth_user is None:
                del session["user_id"]
                return redirect("/")
            return render_template("/views/user/dashboard.html",
                                   auth_user=auth_user,
                                   all_cringe=Cringe.get_all())

        @app.route("/logout")
        def logout():
            session.clear()
            return redirect("/")

        return self

    def create(self, data):
        if not User.validate_form_input(data):
            return redirect("/")

        session["user_id"] = self.model.create(data)
        flash("Success! Welcome to your new account", "success")
        return redirect("/dashboard")

    @authorize_action()
    def show(self, id: int, **kwargs):
        auth_user = kwargs.get("auth_user")
        user = auth_user if id == auth_user.id else self.model.get_by_id(id)
        if user is None:
            return abort(404)

        all_cringe = Cringe.get_all_by_user(auth_user.id)
        setattr(user, "total_cringe", sum(cringe.rating for cringe in all_cringe))

        kwargs["user"] = user
        kwargs["all_cringe"] = all_cringe

        return render_template(f"/views/{self.model_name}/show.html", **kwargs)

    @authorize_action(as_self=True)
    def edit(self, id: int, **kwargs):
        return super().edit(id, **kwargs)

    @authorize_action(as_self=True)
    def update(self, data, **kwargs):
        if not User.validate_form_input(data):
            return redirect(f"/users/{data['id']}/edit")
        else:
            return super().update(data)

    @authorize_action(as_self=True)
    def delete(self, id: int, **kwargs):
        self.model.delete(id)
        return redirect("/logout")
