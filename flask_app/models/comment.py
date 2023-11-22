from flask_app.config.mysqlconnection import connectToMySQL
from flask_app.models.model_base import ModelBase
from flask_app.models import user, comment_rating


class Comment(ModelBase):
    table = "comments"
    fields = [
        "user_id",
        "cringe_id",
        "parent_comment_id",
        "content",
    ]

    @classmethod
    def get_all_for_cringe(cls, cringe_id: int):
        users = user.User.table
        ratings = comment_rating.CommentRating.table
        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username,
                SUM(COALESCE({ratings}.delta, 0)) AS rating
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            LEFT JOIN {ratings}
                ON {ratings}.comment_id = {cls.table}.id
            WHERE {cls.table}.cringe_id = %(cringe_id)s
            GROUP BY {cls.table}.id, {cls.table}.cringe_id
            ORDER BY {cls.table}.created_at ASC
        """
        view = connectToMySQL(cls.db).query_db(query, {"cringe_id": cringe_id})

        items = {}
        for row in view:
            item = cls(row)
            setattr(item, "username", row.get("username"))
            setattr(item, "rating", row.get("rating"))
            setattr(item, "replies", [])
            items[item.id] = item

        for item in items.values():
            if item.parent_comment_id is not None:
                items[item.parent_comment_id].replies.append(item)
                setattr(item, "parent_comment_username", items[item.parent_comment_id].username)

        return [item for item in items.values() if item.parent_comment_id is None]

    @classmethod
    def update(cls, form_data):
        query = f"""
            UPDATE {cls.table}
            SET content = %(content)s
            WHERE id = %(id)s
        """
        return connectToMySQL(cls.db).query_db(query, form_data)
