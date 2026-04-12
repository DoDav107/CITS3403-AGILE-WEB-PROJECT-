from urllib.parse import urljoin, urlparse

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user

from .extensions import db
from .forms import AccountForm, LoginForm, RegistrationForm
from .models import User


bp = Blueprint("auth", __name__, url_prefix="/auth")


def _is_safe_redirect_url(target: str) -> bool:
    if not target:
        return False

    host_url = urlparse(request.host_url)
    redirect_url = urlparse(urljoin(request.host_url, target))
    return redirect_url.scheme in {"http", "https"} and host_url.netloc == redirect_url.netloc


@bp.get("/register")
def register_page():
    if current_user.is_authenticated:
        return redirect(url_for("auth.account"))

    form = RegistrationForm()
    return render_template("register.html", form=form)


@bp.post("/register")
def register():
    if current_user.is_authenticated:
        return redirect(url_for("auth.account"))

    form = RegistrationForm()
    if not form.validate_on_submit():
        return render_template("register.html", form=form), 400

    username = form.username.data.strip()
    email = form.email.data.strip().lower()

    username_exists = User.query.filter_by(username=username).first()
    email_exists = User.query.filter_by(email=email).first()
    if username_exists or email_exists:
        flash("Username or email already exists.", "error")
        return render_template("register.html", form=form), 409

    user = User(username=username, email=email)
    user.set_password(form.password.data)

    db.session.add(user)
    db.session.commit()

    login_user(user)
    flash("Account created successfully.", "success")
    return redirect(url_for("auth.account"))


@bp.get("/login")
def login_page():
    if current_user.is_authenticated:
        return redirect(url_for("auth.account"))

    form = LoginForm()
    next_url = request.args.get("next", "")
    return render_template("login.html", form=form, next_url=next_url)


@bp.post("/login")
def login():
    if current_user.is_authenticated:
        return redirect(url_for("auth.account"))

    next_url = request.form.get("next", "")
    form = LoginForm()
    if not form.validate_on_submit():
        return render_template("login.html", form=form, next_url=next_url), 400

    email = form.email.data.strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(form.password.data):
        flash("Invalid email or password.", "error")
        return render_template("login.html", form=form, next_url=next_url), 401

    login_user(user)
    if not _is_safe_redirect_url(next_url):
        next_url = url_for("auth.account")

    flash("Logged in successfully.", "success")
    return redirect(next_url)


@bp.post("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login_page"))


@bp.route("/account", methods=["GET", "POST"])
@login_required
def account():
    form = AccountForm(obj=current_user)

    if form.validate_on_submit():
        username = form.username.data.strip()
        email = form.email.data.strip().lower()

        existing_username = User.query.filter(User.username == username, User.id != current_user.id).first()
        existing_email = User.query.filter(User.email == email, User.id != current_user.id).first()
        if existing_username or existing_email:
            flash("Username or email already belongs to another account.", "error")
            return render_template("account.html", form=form), 409

        current_user.username = username
        current_user.email = email
        db.session.commit()
        flash("Profile updated successfully.", "success")
        return redirect(url_for("auth.account"))

    if request.method == "GET":
        form.username.data = current_user.username
        form.email.data = current_user.email

    return render_template("account.html", form=form)


@bp.get("/me")
@login_required
def me():
    return jsonify(
        {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
        }
    )
