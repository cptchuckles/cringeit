from flask import redirect, flash
from flask_app import app
from flask_app.config.policy import authorize_action
from flask_app.models.cringe_rating import CringeRating
from flask_app.models.cringe import Cringe
from .controller_base import ControllerBase
import re


class CringeController(ControllerBase):
    def __init__(self):
        super().__init__(Cringe)

    def register_crud_routes(self):
        super().register_crud_routes()

        @app.route("/cringe/<int:id>/rate-cringe", endpoint="cringe/rate-cringe")
        @authorize_action()
        def rate_cringe(id: int, auth_user, **kwargs):
            data = {"cringe_id": id, "user_id": auth_user.id, "delta": 1}
            result = CringeRating.rate_cringe_by_user(data)
            if result is False:
                flash("Unable to rate this Cringe for some reason", "error")
            return redirect(f"/cringe/{id}")

        @app.route("/cringe/<int:id>/rate-boring", endpoint="cringe/rate-boring")
        @authorize_action()
        def rate_boring(id: int, auth_user, **kwargs):
            data = {"cringe_id": id, "user_id": auth_user.id, "delta": -1}
            result = CringeRating.rate_cringe_by_user(data)
            if result is False:
                flash("Unable to rate this Cringe for some reason", "error")
            return redirect(f"/cringe/{id}")

    @authorize_action()
    def new(self, auth_user):
        return super().new(auth_user=auth_user)

    @authorize_action()
    def create(self, form_data, auth_user):
        data = {**form_data}
        data["description"] = re.sub(r"(\s){2,}", r"\1\1", data["description"])
        data["user_id"] = auth_user.id
        return super().create(data)

    @authorize_action()
    def show(self, id: int, **kwargs):
        return super().show(id, **kwargs)

    @authorize_action(as_owner=True)
    def edit(self, id: int, **kwargs):
        return super().edit(id, **kwargs)

    @authorize_action(as_owner=True)
    def update(self, form_data, **kwargs):
        data = {**form_data}
        data["description"] = re.sub(r"(\s){2,}", r"\1\1", data["description"])
        return super().update(data)

    @authorize_action(as_owner=True)
    def delete(self, id: int, **kwargs):
        self.model.delete(id)
        return redirect("/dashboard")
