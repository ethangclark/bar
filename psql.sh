#!/bin/bash

# Check if DATABASE_URL is set in the environment
if [ -z "$DATABASE_URL" ]; then
  # If not set, look for it in the .env file
  if [ -f .env ]; then
    # Extract the DATABASE_URL from the .env file
    DATABASE_URL=$(grep '^DATABASE_URL=' .env | cut -d '"' -f 2)
  else
    echo ".env file not found"
    exit 1
  fi
fi

# Call psql with the DATABASE_URL
psql "$DATABASE_URL"
