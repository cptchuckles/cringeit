from flask_app.config.mysqlconnection import connectToMySQL
from datetime import datetime
from .model_base import ModelBase
from . import user, comment_rating
import re


class Comment(ModelBase):
    table = "comments"
    fields = [
        "user_id",
        "cringe_id",
        "parent_comment_id",
        "content",
    ]

    @classmethod
    def create(cls, form_data):
        data = {**form_data}
        data["content"] = re.sub(r"(\s){2,}", r"\1\1", data["content"])
        if (new_id := super().create(data)) is False:
            return False

        return cls({
            "id": new_id,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            **data
        })

    @classmethod
    def get_tree_for_cringe(cls, cringe_id: int):
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
    def get_full_by_id(cls, id: int):
        users = user.User.table
        ratings = comment_rating.CommentRating.table
        query = f"""
            SELECT
                {cls.table}.*,
                {users}.username AS username,
                parent_comments.username AS parent_comment_username,
                SUM(COALESCE({ratings}.delta, 0)) AS rating
            FROM {cls.table}
            JOIN {users}
                ON {cls.table}.user_id = {users}.id
            LEFT JOIN (
                SELECT {cls.table}.id, {users}.username FROM {cls.table}
                JOIN {users} ON {users}.id = {cls.table}.user_id
            ) AS parent_comments
                ON parent_comments.id = {cls.table}.parent_comment_id
            LEFT JOIN {ratings}
                ON {ratings}.comment_id = {cls.table}.id
            WHERE {cls.table}.id = %(id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"id": id})
        if not view:
            return None

        item = cls(view[0])
        setattr(item, "username", view[0].get("username"))
        setattr(item, "rating", view[0].get("rating"))
        if (parent_username := view[0].get("parent_comment_username")) is not None:
            setattr(item, "parent_comment_username", parent_username)

        return item

    @classmethod
    def update(cls, form_data):
        data = {**form_data}
        data["content"] = re.sub(r"(\s){2,}", r"\1\1", data["content"])
        query = f"""
            UPDATE {cls.table}
            SET content = %(content)s
            WHERE id = %(id)s
        """
        if connectToMySQL(cls.db).query_db(query, data) is False:
            return False
        else:
            return data
