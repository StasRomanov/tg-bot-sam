#!/bin/bash

# Set the path to the logs directory
LOGS_DIR="./logs"

# Set the maximum number of log files to compress
MAX_LOG_FILES=100

# Get the current date and time
CURRENT_DATE=$(date +"%Y.%m.%d-%H.%M.%S")

# Count the number of log files in the directory
LOG_FILE_COUNT=$(ls -1 "$LOGS_DIR"/*.log 2>/dev/null | wc -l)

# Check if there are more than MAX_LOG_FILES log files
if [ "$LOG_FILE_COUNT" -gt "$MAX_LOG_FILES" ]; then
  # Get the list of log files to compress
  LOG_FILES=$(ls -1 "$LOGS_DIR"/*.log 2>/dev/null | head -n "$MAX_LOG_FILES" | tr '\n' ' ')

  # Create the 7zip archive with maximum compression level
  ARCHIVE_NAME="$LOGS_DIR/$CURRENT_DATE.7zip"
  7z a -mx=9 "$ARCHIVE_NAME" $LOG_FILES

  # Delete the original log files
  rm $LOG_FILES
fi
