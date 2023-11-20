from flask_app.config.mysqlconnection import connectToMySQL
from flask_app.models.model_base import ModelBase
from flask_app.models import user


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
        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            WHERE {cls.table}.cringe_id = %(cringe_id)s
            ORDER BY {cls.table}.created_at ASC
        """
        view = connectToMySQL(cls.db).query_db(query, {"cringe_id": cringe_id})

        items = {}
        for row in view:
            item = cls(row)
            setattr(item, "username", row.get("username"))
            setattr(item, "replies", [])
            items[item.id] = item

        for item in items.values():
            if item.parent_comment_id is not None:
                items[item.parent_comment_id].replies.append(item)
                setattr(item, "parent_comment_username", items[item.parent_comment_id].username)

        return [item for item in items.values() if item.parent_comment_id is None]
