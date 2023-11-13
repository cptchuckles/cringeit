from flask_app.config.mysqlconnection import connectToMySQL


class ModelBase:
    db = ""
    table = ""
    fields = []

    def __init__(self, data: dict):
        table = type(self).table

        if data.get(f"{table}.id") is not None:
            for key in data:
                my_key = f"{table}.{key}"
                if my_key in data:
                    data[key] = data[my_key]

        self.id = data["id"]
        self.created_at = data["created_at"]
        self.updated_at = data["updated_at"]

        for field in type(self).fields:
            setattr(self, field, data[field])

    @classmethod
    def get_all(cls):
        query = f"SELECT * FROM {cls.table}"
        view = connectToMySQL(cls.db).query_db(query)
        return [cls(row) for row in view]

    @classmethod
    def get_by_id(cls, id: int):
        query = f"SELECT * FROM {cls.table} WHERE id = %(id)s"
        view = connectToMySQL(cls.db).query_db(query, {"id": id})
        return cls(view[0]) if view else None

    @classmethod
    def create(cls, data: dict):
        prepared_fields = [f"%({field})s" for field in cls.fields]
        query = f"""
            INSERT INTO {cls.table}
            ({", ".join(cls.fields)})
            VALUES
            ({", ".join(prepared_fields)})
        """
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def update(cls, data: dict):
        prepared_updates = [f"{field} = %({field})s" for field in cls.fields]
        query = f"""
            UPDATE {cls.table}
            SET {", ".join(prepared_updates)}
            WHERE id = %(id)s
        """
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def delete(cls, id: int):
        query = f"DELETE FROM {cls.table} WHERE id = %(id)s"
        return connectToMySQL(cls.db).query_db(query, {"id": id})

    @classmethod
    def join_one(cls, left_id: int, right):
        right_model = right.__name__.lower()
        query = f"""
            SELECT * FROM {cls.table}
            JOIN {right.table}
            ON {cls.table}.{right_model}_id = {right.table}.id
            WHERE {cls.table}.id = %(id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"id": left_id})

        if not view:
            return None

        left_item = cls(view[0])
        if f"{right.table}.id" in view[0]:
            right_item = right(view[0])
        else:
            right_item = None

        setattr(left_item, right_model, right_item)

        return left_item

    @classmethod
    def one_join_many(cls, left_id: int, right):
        left_model = cls.__name__.lower()
        query = f"""
            SELECT * FROM {cls.table}
            LEFT JOIN {right.table}
            ON {cls.table}.id = {right.table}.{left_model}_id
            WHERE {cls.table}.id = %(id)s
        """
        view = connectToMySQL(cls.db).query_db(query, {"id": left_id})

        if not view:
            return None

        left_item = cls(view[0])
        right_items = [right(row) for row in view]
        setattr(left_item, right.table, right_items)

        return left_item
