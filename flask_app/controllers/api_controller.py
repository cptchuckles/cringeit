from flask import request
from flask_app import app
from flask_app.models.model_base import ModelBase


def dictify(object) -> dict:
    if isinstance(object, list):
        return [dictify(element) for element in object]

    dictionary = getattr(object, "__dict__", object)

    if dictionary == object:
        return object

    for key in dictionary:
        dictionary[key] = dictify(dictionary[key])

    return dictionary


class ApiController():
    def __init__(self, model: ModelBase):
        self.model = model

    def register_api_crud_routes(self):
        @app.route(f"/api/{self.model.table}", endpoint=f"/api/{self.model.table}/index")
        def index(): return self.index()

        @app.route(f"/api/{self.model.table}/<int:id>", endpoint=f"/api/{self.model.table}/get")
        def get_by_id(id: int): return self.get_by_id(id)

        @app.route(f"/api/{self.model.table}/create", methods=["POST"], endpoint=f"/api/{self.model.table}/create")
        def create(): return self.create(request.form)

        @app.route(f"/api/{self.model.table}/update", methods=["POST"], endpoint=f"/api/{self.model.table}/update")
        def update(): return self.update(request.form)

        @app.route(f"/api/{self.model.table}/<int:id>/delete", endpoint=f"/api/{self.model.table}/delete")
        def delete(id: int): return self.delete(id)

    def index(self):
        return [obj.__dict__ for obj in self.model.get_all()], 200

    def get_by_id(self, id: int):
        item = self.model.get_by_id(id)
        return (item.__dict__, 200) if item is not None else ({}, 404)

    def create(self, form_json):
        result = self.model.create(form_json)
        if not result:
            return {"success": False}, 500
        return {"success": True, "id": result}, 201

    def update(self, form_json):
        result = self.model.update(form_json) is not False
        return ({"success": result}, 204 if result is True else 500)

    def delete(self, id: int):
        result = self.model.delete(id) is not False
        return ({"success": result}, 204 if result is True else 500)
