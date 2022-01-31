from flask import(
	Blueprint, flash, g, redirect, render_template, request, session, url_for, jsonify, current_app
	)
from flask_babel import _
from flask_babel import lazy_gettext as _l
from povarezik.db import get_db

import os
import imghdr
import functools

bp = Blueprint("recipes", __name__)

@bp.route("/text")
def text():
	return render_template("recipes/text.html")

STD_PICTURES_DIRECTORY = "../../_src"
RECIPES_PICTURE_DIRECTORY = "povarezik/static/img/recipes"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'JPEG', 'gif'}

def get_lanuage(view):

	@functools.wraps(view)
	def wrapped_view(**kwargs):
		if not session.get('language'):
			session['language'] = session.get('language') or request.accept_languages.best_match(current_app.config['LANGUAGES'])
		return view(**kwargs)
	return wrapped_view

@bp.route("/")
@get_lanuage
def recipes():
	recipes, categories = get_recipes()
	return render_template("recipes/recipes.html", recipes=recipes, categories=categories)

@bp.route("/demo")
@get_lanuage
def demo():
	return render_template("recipes/demo.html")

@bp.route("/post_recipe_form")
@get_lanuage
def post_recipe_form():
	categories = get_categories()
	return render_template("recipes/post_recipe_form.html", categories=categories)

@bp.route("/post_recipe", methods=["POST"])
def post_recipe():
	#maps db field names and frontend field names
	fields = (
		('title', "recipeName", str),
		('description', "description", str),
		('author', "author", str),
		('video_link', "video-link", str),
		('category_id', "recipe-category", int),
		('language_id', "recipeLanguage", int),
		('cooking_time', "cooking-time", int),
		('ekadashi', "ekadashi", int),
		('vegan', "vegan", int),
		)
	data = {}
	for i in fields:
		data[i[0]] = request.form.get(i[1], 0, type=i[2])

	data['ingredients'] = request.form.getlist('ingredient[]')

	data['steps'] = request.form.getlist('step[]')

	#Validation start

	if not data['title'] or not data['description'] or not data['category_id'] or not data['language_id']:
		return {'message': _("Required fields were not supplied, please check the input form and try again :)")}

	if not data['author']:
		data['author'] = "Anonymous"

	if len(data['description']) > 900:
		return {'message': _("The length of the description is too long, please move part of it to the next step or make it shorter :)")}


	if len(data['ingredients']) < 1 or data['ingredients'][0] == "":
		return {'message': _("You did not supply any ingredients yet, please do so and post the recipe again :)")}

	#Validation end

	recipe_id = send_recipe_data_to_database(data)
	# recipe_id = 6
	print(data)

	#creates a directory for the recipe's images
	if not os.path.exists(os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id))):
		os.mkdir(os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id)))

	files = request.files.getlist('image[]')
	for i in range(len(files)):
		if files[i].filename != '':	#for image fields that are left blank
			print(os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id), str(i + 1) + '.png'))
			if file_is_image(files[i]):
				files[i].save(os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id), str(i + 1) + '.png'))

	#If user did not upload a thumbnail(1.png), creates a soft link to the default recipe thumbnail file('recipe_thumb.png')
	# if not os.path.exists(os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id), '1.png')):
	# 	os.symlink(os.path.join(STD_PICTURES_DIRECTORY, 'recipe_thumb.png'), os.path.join(RECIPES_PICTURE_DIRECTORY, str(recipe_id), '1.png'))


	return {'message': _('Your recipe was posted successfully, please wait for moderators to approve it :)')}


@bp.route("/recipe/<int:id>", methods=["GET"])
@get_lanuage
def recipe(id):
	id = int(id)
	recipe, ingredients, steps = get_recipe(id)

	return render_template("recipes/recipe.html", recipe=recipe, ingredients=ingredients, steps=steps)

@bp.route('/recipe/<int:id>/edit', methods=["GET"])
@get_lanuage
def edit_recipe(id):
	id = int(id)
	categories = get_categories()
	recipe, ingredients, steps = get_recipe(id)

	return render_template("recipes/edit.html", recipe=recipe, ingredients=ingredients, steps=steps, categories=categories)


def send_recipe_data_to_database(data):
	connection = get_db()
	cursor = connection.cursor()
	#recipe insert
	cursor.execute("INSERT INTO recipes(title, description, author, video_link, category_id, language_id, cooking_time) VALUES (%s, %s, %s, %s, %s, %s, %s);", (data['title'], data['description'], data['author'], data['video_link'], data['category_id'], data['language_id'], data['cooking_time']))
	recipe_id = cursor.lastrowid	#for the recipe_id in the steps and other tables
	connection.commit()

	#steps insert, generating list for the executmany
	for i in range(len(data['steps'])):
		data['steps'][i] = (data['steps'][i], i+1, recipe_id)
	cursor.executemany("INSERT INTO steps (`text`, `position` ,recipe_id) VALUES (%s, %s, %s);", (data['steps']))

	#ingredients insert
	# ingredients = list(zip(data['ingredients'][0], data['ingredients'][1], data['ingredients'][2], [recipe_id]*len(data['ingredients'][0])))
	ingredients = list(zip(data['ingredients'], [recipe_id]*len(data['ingredients'])))
	cursor.executemany("INSERT INTO ingredients (name, recipe_id) VALUES (%s, %s);", (ingredients))

	#filter insert
	cursor.execute("INSERT INTO filters (ekadashi, vegan, recipe_id) VALUES (%s, %s, %s);", (data['ekadashi'], data['vegan'], recipe_id))

	connection.commit()
	cursor.close()

	return recipe_id

@bp.app_errorhandler(413)
@get_lanuage
def too_large(e):
	return {'message':_('One of the images that you tried to upload was too large, please compress it or chose another images')}


def get_recipes():
	connection = get_db()
	cursor = connection.cursor()

	cursor.execute("SELECT * from languages;")
	languages = cursor.fetchall()
	for i in languages:
		if i['abreviation'] == session.get('language'):
			language_id = i['id']

	#DO NOT FORGET TO FIX UP FOR LANGUAGES AND APPROVED RECIPES
	cursor.execute("SELECT recipes.*, GROUP_CONCAT(CONCAT_WS(' ', ingredients.name) separator ', ') AS ingredient_list, filters.ekadashi, filters.vegan FROM recipes  INNER JOIN ingredients ON id=recipe_id LEFT JOIN filters on id=f_recipe_id WHERE language_id=%s AND approved=0 GROUP BY id;", language_id)
	recipes = cursor.fetchall()

	cursor.execute("SELECT * from categories")
	categories = cursor.fetchall()
	cursor.close()

	return (recipes, categories)

def get_recipe(id):
	connection = get_db()
	cursor = connection.cursor()
	cursor.execute("SELECT * FROM recipes WHERE id=%s;", id)
	recipe = cursor.fetchone()

	cursor.execute("SELECT * FROM ingredients WHERE recipe_id=%s;", id)
	ingredients = cursor.fetchall()

	cursor.execute("SELECT * FROM steps WHERE recipe_id=%s;", id)
	steps = cursor.fetchall()
	connection.close()

	return (recipe, ingredients, steps)

def get_categories():
	'''
		THIS FUNCTON OPENS BUT DOES NOT CLOSE THE DB CONNECTION!!!
	'''	
	connection = get_db()
	cursor = connection.cursor()
	cursor.execute("SELECT * FROM categories;")
	categories = cursor.fetchall()
	print(type(categories))
	# connection.close()
	return categories

def file_is_image(stream):
	header = stream.read(512)
	stream.seek(0)
	format = imghdr.what(None, header)
	print(format)
	if format not in ALLOWED_EXTENSIONS:
		return False
	return True
