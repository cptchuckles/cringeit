from flask import Flask, render_template, session, redirect
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.secret_key = "super secret key"

bcrypt = Bcrypt(app)


@app.route("/")
def home():
    if "user_id" in session:
        return redirect("/dashboard")

    args = {}
    if "redo" in session:
        args["user"] = session["redo"]
        del session["redo"]

    return render_template("home.html", **args)
