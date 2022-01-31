from flaskext.mysql import MySQL
from pymysql.cursors import DictCursor

from flask import current_app, g

mysql = MySQL(cursorclass=DictCursor)

def get_db():
	if 'db' not in g:
		connection = mysql.connect()
		g.db = connection

	return g.db

def close_db(e=None):
	db = g.pop('db', None)

	if db is not None:
		db.close()