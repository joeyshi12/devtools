#!/bin/sh
export DB_HOST="0.0.0.0"
export DB_USER="my_user"
export DB_PASS="password"
export DB_NAME="test"
flask --debug run
