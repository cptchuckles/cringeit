from flask import redirect, flash
from flask_app.config.policy import authorize_action
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.comment import Comment


class CommentController(ControllerBase):
    def __init__(self):
        super().__init__(Comment)

    @authorize_action()
    def create(self, form_data, **kwargs):
        new_comment_id = self.model.create(form_data)
        if new_comment_id is False:
            flash("Comment could not be added for some reason", "error")
        return redirect(f"/cringe/{ form_data.get('cringe_id') }")

    @authorize_action(as_owner=True, unauthorized_to="/cringe/<cringe_id>")
    def update(self, form_data, **kwargs):
        if not self.model.update(form_data):
            flash("Comment could not be modified for some reason", "error")
        return redirect(f"/cringe/{ form_data.get('cringe_id') }")
