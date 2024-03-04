#!/bin/sh
export DB_HOST="0.0.0.0"
export DB_USER="my_user"
export DB_PASSWORD="password"
export DB_NAME="devtools"
flask --debug run
