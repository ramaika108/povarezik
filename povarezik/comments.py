from flask import(
	Blueprint, g, request, session, url_for, jsonify
	)
from povarezik.db import get_db

from flask_babel import _
from flask_babel import lazy_gettext as _l

import os
import imghdr

RECIPES_PICTURE_DIRECTORY = "povarezik/static/img/recipes"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def file_is_image(stream):
	header = stream.read(512)
	stream.seek(0)
	format = imghdr.what(None, header)
	if format not in ALLOWED_EXTENSIONS:
		return False
	return True

bp = Blueprint("comments", __name__)


@bp.route("/get_comments", methods=["POST"])
def get_comments():

	recipe_id = int(request.get_data().decode())

	connection = get_db()
	cursor = connection.cursor()

	cursor.execute("SELECT * FROM comments WHERE recipe_id=%s AND !parent_id AND complaints<3;", str(recipe_id))
	comments = cursor.fetchall()

	cursor.execute("SELECT * FROM comments WHERE recipe_id=%s AND parent_id AND complaints<3;", str(recipe_id))
	replies = cursor.fetchall()

	print('replies: ', replies, 'comments: ', comments, sep='\n')

	#Nests all the replies into the appropriate comments
	if len(replies) > 0:
		for i in replies:
			for j in comments:
				if j['id'] == i['parent_id']:
					if 'replies' in j.keys():
						j['replies'].append(i)
					else:
						j['replies'] = []
						j['replies'].append(i)


	#remove later
	if len(replies) > 0:
		for i in comments:					
			print(i['id'], i['text'])
			if 'replies' in j.keys():
				for j in i['replies']:
					print('\t', j['id'], j['parent_id'], j['text'])
	#remove later

	return jsonify(comments)

@bp.route("/post_comment", methods=["POST"])
def post_comment():
	data = {}
	data['recipeId'] = request.form.get('recipeId', 0, type=int)
	data['parentId'] = request.form.get('parentId', 0, type=int)
	data['commentBody'] = request.form.get('commentBody', 0, type=str)
	data['authorName'] = request.form.get('authorName', 0, type=str)

	#validatinon
	if not data['recipeId'] or not data['commentBody'] or not data['authorName']:
		return {'message': _('Required fields were not supplied, please check the input form and try again :)'), 'error': 1}


	connection = get_db()
	cursor = connection.cursor()

	cursor.execute("INSERT INTO flask_dev.comments (recipe_id, `text`, parent_id, author_name) VALUES(%s, %s, %s, %s);", (data['recipeId'], data['commentBody'], data['parentId'], data['authorName']))
	comment_id = cursor.lastrowid
	connection.commit()
	cursor.close()

	if not os.path.exists(os.path.join(RECIPES_PICTURE_DIRECTORY, str(data['recipeId']), 'comments')):
		os.mkdir(os.path.join(RECIPES_PICTURE_DIRECTORY, str(data['recipeId']), 'comments'))

	image = request.files.get('photo')
	if file_is_image(image):
		image.save(os.path.join(RECIPES_PICTURE_DIRECTORY, str(data['recipeId']), 'comments', str(comment_id) + '.png'))

	print(data)

	return {'message': _('Comment posted succesfully'), 'error': 0}


@bp.route("/report_comment", methods=["POST"])
def report_comment():
	id = int(request.get_data().decode())

	connection = get_db()
	cursor = connection.cursor()
	cursor.execute("UPDATE comments SET complaints=complaints+1 WHERE id=%s;", str(id))
	connection.commit()
	cursor.close()

	return jsonify('done')

