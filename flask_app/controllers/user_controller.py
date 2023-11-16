from flask import redirect, session, render_template, flash, request
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.user import User
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
        def dashboard():
            if "user_id" not in session:
                return redirect("/")
            user = User.get_by_id(int(session["user_id"]))
            if user is None:
                del session["user_id"]
                return redirect("/")
            return render_template("/views/user/dashboard.html", user=user)

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

    def edit(self, id: int):
        if "user_id" not in session or session["user_id"] != id:
            return redirect("/")

        return super().edit(id)

    def update(self, data):
        if "user_id" not in session:
            return redirect("/")

        if "id" not in data or session["user_id"] != int(data["id"]):
            return redirect("/")

        if not User.validate_form_input(data):
            return redirect(f"/users/{data['id']}/edit")

        return super().update(data)

    def delete(self, id: int):
        if "user_id" not in session:
            return redirect("/")

        if session["user_id"] != id:
            return redirect("/dashboard")

        return super().delete(id)
