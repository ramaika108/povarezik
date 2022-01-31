import os
from flask import Flask, request, session, redirect
from flask_babel import Babel
from flask_babel_js import BabelJS

def create_app(test_config=None):
	app = Flask(__name__, instance_relative_config=True)
	# app.config.from_mapping(SECRET_KEY='dep')

	if test_config is None:
		app.config.from_pyfile('config.py', silent=False)
	else:
		app.config.from_mapping(test_config)

	try:
		os.makedirs(app.instance_path)
	except OSError:
		pass

	babel = Babel(app)
	babel_js = BabelJS(app)

	@babel.localeselector
	def get_locale():
		language = session.get('language') or request.accept_languages.best_match(app.config['LANGUAGES'])
		return language

	@app.route("/change_lang", methods=["POST", "GET"])
	def change_lang():
		session["language"] = request.form.get('language')
		get_locale()
		print('changed language to: ', session.get('language'))
		return 'someting'


	from . import db
	db.mysql.init_app(app)

	# @app.route("/")
	# def home():
	# 	return app.config['SECRET_KEY']

	from . import recipes
	app.register_blueprint(recipes.bp)

	from . import comments
	app.register_blueprint(comments.bp)

	return app