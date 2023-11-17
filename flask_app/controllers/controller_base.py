from flask import render_template, abort, request, redirect
from flask_app.models.model_base import ModelBase
from flask_app import app


class ControllerBase:
    def __init__(self, model: ModelBase):
        self.model = model
        self.model_name = self.model.__name__.lower()

    def register_crud_routes(self):
        @app.route(f"/{self.model.table}", endpoint=f"{self.model.table}/index")
        def index(): return self.index()

        @app.route(f"/{self.model.table}/<int:id>", endpoint=f"{self.model.table}/show")
        def show(id: int): return self.show(id)

        @app.route(f"/{self.model.table}/new", endpoint=f"{self.model.table}/new")
        def new(): return self.new()

        @app.route(f"/{self.model.table}/create", methods=["POST"], endpoint=f"{self.model.table}/create")
        def create(): return self.create(request.form)

        @app.route(f"/{self.model.table}/<int:id>/edit", endpoint=f"{self.model.table}/edit")
        def edit(id: int): return self.edit(id)

        @app.route(f"/{self.model.table}/update", methods=["POST"], endpoint=f"{self.model.table}/update")
        def update(): return self.update(request.form)

        @app.route(f"/{self.model.table}/<int:id>/delete", endpoint=f"{self.model.table}/delete")
        def delete(id: int): return self.delete(id)

    def index(self, **kwargs):
        collection = self.model.get_all()
        return render_template(f"views/{self.model_name}/index.html",
                               **{self.model.table: collection, **kwargs})

    def show(self, id: int, **kwargs):
        item = self.model.get_by_id(id)
        if item is None:
            return abort(404)
        kwargs[self.model_name] = item
        return render_template(f"/views/{self.model_name}/show.html", **kwargs)

    def new(self, **kwargs):
        return render_template(f"/views/{self.model_name}/new.html", **kwargs)

    def create(self, form_data):
        new_id = self.model.create(form_data)
        return redirect(f"/{self.model.table}/{new_id}")

    def edit(self, id: int, **kwargs):
        item = self.model.get_by_id(id)
        if item is None:
            return abort(404)
        kwargs[self.model_name] = item
        return render_template(f"/views/{self.model_name}/edit.html", **kwargs)

    def update(self, form_data):
        self.model.update(form_data)
        return redirect(f"/{self.model.table}/{form_data.get('id')}")

    def delete(self, id: int):
        self.model.delete(id)
        return redirect(f"/{self.model.table}")
