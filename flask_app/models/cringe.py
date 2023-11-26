from flask_app.config.mysqlconnection import connectToMySQL
from flask_app.models.model_base import ModelBase
from flask_app.models import user, cringe_rating


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
        users = user.User.table
        ratings = cringe_rating.CringeRating.table

        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username,
                SUM(COALESCE({ratings}.delta, 0)) AS rating
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            LEFT JOIN {ratings}
                ON {ratings}.cringe_id = {cls.table}.id
            WHERE {cls.table}.id = %(id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"id": id})
        if not view or view[0].get("id") is None:
            return None

        item = cls(view[0])
        setattr(item, "username", view[0].get("username"))
        setattr(item, "rating", int(view[0].get("rating")))

        return item

    @classmethod
    def get_all(cls):
        users = user.User.table
        ratings = cringe_rating.CringeRating.table

        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username,
                SUM(COALESCE({ratings}.delta, 0)) AS rating
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            LEFT JOIN {ratings}
                ON {ratings}.cringe_id = {cls.table}.id
            GROUP BY {cls.table}.id
            ORDER BY {cls.table}.created_at DESC
        """
        view = connectToMySQL(cls.db).query_db(query)

        items = []
        for row in view:
            item = cls(row)
            setattr(item, "username", row.get("username"))
            setattr(item, "rating", row.get("rating"))
            items.append(item)

        return items

    @classmethod
    def get_all_by_user(cls, user_id: int):
        users = user.User.table
        ratings = cringe_rating.CringeRating.table

        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username,
                SUM(COALESCE({ratings}.delta, 0)) AS rating
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            LEFT JOIN {ratings}
                ON {ratings}.cringe_id = {cls.table}.id
            WHERE {cls.table}.user_id = %(user_id)s
            GROUP BY {cls.table}.id, {cls.table}.user_id
            ORDER BY {cls.table}.created_at DESC
        """
        view = connectToMySQL(cls.db).query_db(query, {"user_id": user_id})

        items = []
        for row in view:
            item = cls(row)
            setattr(item, "username", row.get("username"))
            setattr(item, "rating", row.get("rating"))
            items.append(item)

        return items
