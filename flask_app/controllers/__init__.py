from flask_app.controllers.user_controller import UserController
from flask_app.controllers.cringe_controller import CringeController
from flask_app.controllers.comment_controller import CommentController
from .comment_api_controller import CommentApiController

UserController().register_crud_routes().register_user_auth_routes()
CringeController().register_crud_routes()
CommentController().register_crud_routes()
CommentApiController().register_api_crud_routes()
