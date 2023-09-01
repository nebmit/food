#!/bin/bash

DB_PATH="./src/lib/database.db"
SCHEMA_PATH="./db_schema.sql"

# Check if database exists
if [ ! -f $DB_PATH ]; then
  echo "Database not found! Initializing..."
  
  # Create and initialize database
  sqlite3 $DB_PATH < $SCHEMA_PATH

  echo "Database initialized successfully."
else
  echo "Database already exists. No action performed."
fi
