from flask import render_template, abort, request, redirect
from flask_app.models import ModelBase
from flask_app import app


class ControllerBase:
    def __init__(self, model: ModelBase):
        self.model = model
        self.model_name = self.model.__name__.lower()
        self.item_name = self.model_name
        self.collection_name = self.model_name + "s"

    def register_crud_routes(self):
        @app.route(f"/{self.model_name}", endpoint=f"{self.model_name}/index")
        def index(): return self.index()

        @app.route(f"/{self.model_name}/<int:id>", endpoint=f"{self.model_name}/show")
        def show(id: int): return self.show(id)

        @app.route(f"/{self.model_name}/new", endpoint=f"{self.model_name}_new")
        def new(): return self.new()

        @app.route(f"/{self.model_name}/create", methods=["POST"], endpoint=f"{self.model_name}/create")
        def create(): return self.create(request.form)

        @app.route(f"/{self.model_name}/<int:id>/edit", endpoint=f"{self.model_name}/edit")
        def edit(id: int): return self.edit(id)

        @app.route(f"/{self.model_name}/update", methods=["POST"], endpoint=f"{self.model_name}/update")
        def update(): return self.update(request.form)

        @app.route(f"/{self.model_name}/<int:id>/delete", endpoint=f"{self.model_name}/delete")
        def delete(id: int): return self.delete(id)

    def index(self):
        collection = self.model.get_all()
        return render_template(f"views/{self.model_name}/index.html", **{self.collection_name: collection})

    def show(self, id: int):
        item = self.model.get_by_id(id)
        if item is None:
            return abort(404)
        else:
            return render_template(f"/views/{self.model_name}/show.html", **{self.item_name: item})

    def new(self):
        return render_template(f"/views/{self.model_name}/new.html")

    def create(self, form_data):
        new_id = self.model.create(form_data)
        return redirect(f"/{self.model_name}/{new_id}")

    def edit(self, id: int):
        item = self.model.get_by_id(id)
        if item is None:
            return abort(404)
        else:
            return render_template(f"/views/{self.model_name}/edit.html", **{self.item_name: item})

    def update(self, form_data):
        item = self.model.update(form_data)
        if item is None:
            return abort(500)
        else:
            return redirect(f"/{self.model_name}/{item.id}")

    def delete(self, id: int):
        self.model.delete(id)
        return redirect(f"/{self.model_name}")
