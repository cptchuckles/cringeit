from flask_app.config.mysqlconnection import connectToMySQL


class ModelBase:
    db = "books_schema"
    table = ""
    fields = []

    def __init__(self, data):
        self.id = data["id"]
        self.created_at = data["created_at"]
        self.updated_at = data["updated_at"]

        for field in self.__class__.fields:
            self.__dict__[field] = data[field]

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
    def create(cls, data):
        prepared_fields = [f"%({field})s" for field in cls.fields]
        query = f"""
            INSERT INTO {cls.table}
            ({", ".join(cls.fields)})
            VALUES
            ({", ".join(prepared_fields)})
        """
        return connectToMySQL(cls.db).query_db(query, data)

    @classmethod
    def update(cls, data):
        prepared_fields = [f"%({field})s" for field in cls.fields]
        pairs = zip(cls.fields, prepared_fields)
        sets = [f"{pair[0]} = {pair[1]}" for pair in pairs]
        query = f"""
            UPDATE {cls.table}
            SET {", ".join(sets)}
            WHERE id = %(id)s
        """
        connectToMySQL(cls.db).query_db(query, data)

        return cls.get_by_id(int(data["id"]))

    @classmethod
    def delete(cls, id: int):
        query = f"DELETE FROM {cls.table} WHERE id = %(id)s"
        return connectToMySQL(cls.db).query_db(query, {"id": id})

    @classmethod
    def many_join_one(cls, left_id: int, right):
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

        first_row = {**view[0]}

        for key in first_row:
            right_key = f"{right.table}.{key}"
            if right_key in first_row:
                first_row[key] = first_row[right_key]

        right_item = right(first_row)

        return (cls(view[0]), right_item)

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

        first_row = {**view[0]}
        left_item = cls(first_row)

        right_items = []

        for row in view:
            for key in row:
                right_key = f"{right.table}.{key}"
                if right_key in row:
                    row[key] = row[right_key]
            if row["id"] is None:
                right_items = None
                break
            right_items.append(right(row))

        return (left_item, right_items)
