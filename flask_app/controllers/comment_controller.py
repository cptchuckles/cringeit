from flask import redirect, flash
from flask_app.config.policy import authorize_action
from flask_app.controllers.controller_base import ControllerBase
from flask_app.models.comment import Comment
from flask_app.models.comment_rating import CommentRating
from flask_app import app
import re


class CommentController(ControllerBase):
    def __init__(self):
        super().__init__(Comment)

    def register_crud_routes(self):
        super().register_crud_routes()

        def rate_comment(comment_id: int, user_id: int, delta: int):
            data = {"comment_id": comment_id, "user_id": user_id, "delta": delta}
            result = CommentRating.rate_comment(data)
            if result is False:
                flash("Couldn't rate comment for some reason", "error")
            comment = Comment.get_by_id(comment_id)
            if comment is None:
                flash("Comment not found", "error")
                return redirect("/dashboard")
            return redirect(f"/cringe/{comment.cringe_id}#comment-{comment_id}")

        @app.route("/comments/<int:id>/rate-up", endpoint="comments/rate-up")
        @authorize_action()
        def rate_up(id: int, auth_user):
            return rate_comment(id, auth_user.id, 1)

        @app.route("/comments/<int:id>/rate-down", endpoint="comments/rate-down")
        @authorize_action()
        def rate_down(id: int, auth_user):
            return rate_comment(id, auth_user.id, -1)

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
