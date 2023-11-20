from flask_app.config.mysqlconnection import connectToMySQL
from flask_app.models.model_base import ModelBase


class CringeRating(ModelBase):
    table = "cringe_ratings"
    fields = [
        "cringe_id",
        "user_id",
        "delta",
    ]

    @classmethod
    def update(cls, data: dict):
        query = f"""
            UPDATE {cls.table}
            SET delta = %(delta)s
            WHERE id = %(id)s
        """
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def rate_cringe_by_user(cls, data):
        query = "CALL UpsertCringeRating(%(cringe_id)s, %(user_id)s, %(delta)s)"
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def delete_rating_for_cringe_by_user(cls, cringe_id: int, user_id: int):
        query = f"""
            DELETE FROM {cls.table}
            WHERE user_id = %(user_id)s AND cringe_id = %(cringe_id)s;
        """
        return connectToMySQL(cls.db).query_db(query, {"user_id": user_id, "cringe_id": cringe_id})

    @classmethod
    def get_rating_for_cringe_by_user(cls, cringe_id: int, user_id: int):
        query = f"""
            SELECT * FROM {cls.table}
            WHERE user_id = %(user_id)s AND cringe_id = %(cringe_id)s;
        """
        view = connectToMySQL(cls.db).query_db(query, {"user_id": user_id, "cringe_id": cringe_id})
        return cls(view[0]) if view else None
