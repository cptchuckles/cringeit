from flask_app.controllers.user_controller import UserController

UserController().register_crud_routes().register_user_auth_routes()
