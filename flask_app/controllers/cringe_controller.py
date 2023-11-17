# from flask import redirect, session, render_template, flash, request
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.cringe import Cringe
from flask_app.config.policy import authorize_view


class CringeController(ControllerBase):
    def __init__(self):
        super().__init__(Cringe)

    @authorize_view()
    def new(self, user):
        return super().new(user=user)

    @authorize_view()
    def create(self, form_data, user):
        data = {**form_data}
        data["user_id"] = user.id
        return super().create(data)
