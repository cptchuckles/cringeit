from flask_app.config.mysqlconnection import connectToMySQL
from flask_app.models.model_base import ModelBase
from flask_app.models import user


class Cringe(ModelBase):
    table = "cringe"
    fields = [
        "user_id",
        "headline",
        "url",
        "description",
    ]

    @classmethod
    def get_by_id(cls, id: int):
        return super().join_one(id, user.User)

    @classmethod
    def get_all(cls):
        users = user.User.table
        query = f"""
            SELECT * FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
        """
        view = connectToMySQL(cls.db).query_db(query)

        items = []
        for row in view:
            item = cls(row)
            setattr(item, "user", user.User(row))
            items.append(item)

        return items
