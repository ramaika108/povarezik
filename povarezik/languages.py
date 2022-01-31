from flask import Blueprint, request, session, current_app
from flask_babel import Babel

bp = Blueprint("languages", __name__)

babel = Babel(current_app)

@babel.localeselector
def get_locale():
	language = session.get('language') or request.accept_languages.best_match(app.config['LANGUAGES'])
	print('current language: ', language)
	return language
	# return 'ru'

@bp.route("/change_lang", methods=["POST"])
def change_lang():
	session["language"] = request.form.get('language')
	print('got language from user', session.get('language'))
	get_locale()
	return 'someting'
