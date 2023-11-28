from flask_app.config.mysqlconnection import connectToMySQL
from .model_base import ModelBase
from . import user, comment


class CommentRating(ModelBase):
    table = "comment_ratings"
    fields = [
        "comment_id",
        "user_id",
        "delta"
    ]

    @classmethod
    def rate_comment(cls, data):
        query = "CALL UpsertCommentRating(%(comment_id)s, %(user_id)s, %(delta)s)"
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def get_rating_for_comment_by_user(cls, comment_id: int, user_id: int):
        query = f"""
            SELECT * FROM {cls.table}
            WHERE comment_id = %(comment_id)s AND user_id = %(user_id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"comment_id": comment_id, "user_id": user_id})
        return cls(view[0]) if view else None

    @classmethod
    def delete_rating_for_comment_by_user(cls, comment_id: int, user_id: int):
        query = f"""
            DELETE FROM {cls.table}
            WHERE comment_id = %(comment_id)s AND user_id = %(user_id)s
        """
        return connectToMySQL(cls.db).query_db(query, {"comment_id": comment_id, "user_id": user_id})

    @classmethod
    def get_sum_for_user(cls, user_id: int):
        users = user.User.table
        comments = comment.Comment.table
        query = f"""
            SELECT COALESCE(SUM({cls.table}.delta), 0) AS total_ratings
            FROM {cls.table}
            JOIN {comments}
                ON {comments}.id = {cls.table}.comment_id
            JOIN {users}
                ON {users}.id = {comments}.user_id
            WHERE {comments}.user_id = %(user_id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"user_id": user_id})
        return int(view[0].get("total_ratings"))
