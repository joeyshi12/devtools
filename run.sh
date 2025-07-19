#!/bin/sh

export DB_HOST="0.0.0.0"
export DB_USER="root"
export DB_PASS="password"
export DB_NAME="devtools"

flask --debug run
