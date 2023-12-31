#!/bin/bash

DB_PATH="./database.db"
SCHEMA_PATH="./db_schema.sql"

# Function to initialize the database
initialize_db() {
  echo "Initializing database..."

  # Create and initialize database
  sqlite3 $DB_PATH < $SCHEMA_PATH

  echo "Database initialized successfully."
}

# Check for -f flag
if [[ "$1" == "-f" ]]; then
  if [ -f $DB_PATH ]; then
    echo "Force flag detected. Deleting existing database."
    rm $DB_PATH
  fi
  initialize_db
else
  # Check if database exists
  if [ ! -f $DB_PATH ]; then
    initialize_db
  else
    echo "Database already exists. No action performed."
  fi
fi
