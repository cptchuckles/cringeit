from flask import redirect, flash
from flask_app.config.policy import authorize_action
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.comment import Comment
import re


class CommentController(ControllerBase):
    def __init__(self):
        super().__init__(Comment)

    @authorize_action()
    def create(self, form_data, **kwargs):
        data = {**form_data}
        data["content"] = re.sub(r"(\s){2,}", r"\1\1", data["content"])
        new_comment_id = self.model.create(data)
        if new_comment_id is False:
            flash("Comment could not be added for some reason", "error")
        return redirect(f"/cringe/{ data.get('cringe_id') }#comment-{ new_comment_id }")

    @authorize_action(as_owner=True, unauthorized_to="/cringe/[cringe_id]")
    def update(self, form_data, **kwargs):
        if not self.model.update(form_data):
            flash("Comment could not be modified for some reason", "error")
        return redirect(f"/cringe/{ form_data.get('cringe_id') }")

    @authorize_action(as_owner=True, unauthorized_to="/cringe/:cringe_id")
    def delete(self, id: int, **kwargs):
        status = self.model.delete(id)
        if status is False:
            flash("Comment could not be deleted for some reason", "error")
        comment = kwargs["comment"]
        if comment.parent_comment_id is not None:
            parent_comment = f"#comment-{comment.parent_comment_id}"
        else:
            parent_comment = ""
        return redirect(f"/cringe/{kwargs['comment'].cringe_id}" + parent_comment)
