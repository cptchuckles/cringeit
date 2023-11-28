from flask import get_flashed_messages
from flask_app import app
from flask_app.config.policy import authorize_action
from flask_app.models.comment import Comment
from flask_app.models.cringe import Cringe
from .api_controller import ApiController, dictify


def api_error(*args, **kwargs):
    return {"errors": get_flashed_messages(category_filter="error")}, kwargs.get("status", 403)


def authorize_api_action(**kwargs):
    return authorize_action(error_handler=api_error, **kwargs)


class CommentApiController(ApiController):
    def __init__(self):
        super().__init__(Comment)

    def register_api_crud_routes(self):
        super().register_api_crud_routes()

        @app.route(f"/api/{Cringe.table}/<int:cringe_id>/{self.model.table}", endpoint=f"{self.model.table}/api/by-cringe-id")
        @authorize_api_action()
        def get_comments_for_cringe(cringe_id: int, **kwargs):
            return dictify(Comment.get_tree_for_cringe(cringe_id))

    @authorize_api_action()
    def index(self, **kwargs):
        return super().index()

    @authorize_api_action()
    def get_by_id(self, id: int, auth_user, **kwargs):
        return super().get_by_id(id)

    @authorize_api_action()
    def create(self, form_json, auth_user, **kwargs):
        data = {**form_json}
        data["user_id"] = auth_user.id
        if (result := self.model.create(data)) is False:
            return {"success": False, "errors": ["Database failure"]}, 500
        else:
            return {"success": True, "data": dictify(result)}, 201

    @authorize_api_action(as_owner=True)
    def update(self, form_json, **kwargs):
        if (result := self.model.update(form_json)) is not False:
            return {"success": True, "data": result}, 200
        else:
            return {"success": False, "errors": ["Database failure"]}, 500

    @authorize_api_action(as_owner=True)
    def delete(self, id: int, **kwargs):
        return super().delete(id)
