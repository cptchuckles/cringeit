from .user_controller import UserController
from .cringe_controller import CringeController
from .comment_controller import CommentController
from .comment_api_controller import CommentApiController

UserController().register_crud_routes().register_user_auth_routes()
CringeController().register_crud_routes()
CommentController().register_crud_routes()
CommentApiController().register_api_crud_routes()
