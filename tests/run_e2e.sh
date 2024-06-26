#!/usr/bin/env bash

TEST="$1" # We will run these tests
LOGDIR="./tests/end2end/logs"
SERVERLOG="$LOGDIR/server.log"
MONGODB_HOST="localhost:3101"
MONGODB_DB="meteor"
VERSIONS_DIR="./versions"

# Ensure necessary commands are available
for cmd in npm mongodump google-chrome; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd could not be found"
    exit 1
  fi
done

# Function to echo and log
log() {
  echo "$1"
  echo "$1" >>"$SERVERLOG"
}
echo Remove old log file
mkdir -p "$LOGDIR"
rm -f "$SERVERLOG"

log "Starting end2end server"
npm run test:end2end:server >>"$SERVERLOG" 2>&1 &
SERVER_PID=$!

wait_for_server_start() {
  local counter=0
  local max_wait=900
  until grep "=> App running at" "$SERVERLOG"; do
    log "App has not started yet.. Waiting for $counter seconds"
    sleep 30
    counter=$((counter + 30))
    if [ "$counter" -gt "$max_wait" ]; then
      log "Meteor takes too long to start, exiting. Server log:"
      cat "$SERVERLOG"
      exit 1
    fi
    if grep "=> Your application has errors." "$SERVERLOG"; then
      log "Meteor reports build errors, exiting. Server log:"
      cat "$SERVERLOG"
      exit 1
    fi
  done
}
wait_for_server_start
sleep 10

log "Starting end2end test runner"
export HEADLESS=1 # evaluated by wdio.conf.js
export CHROME_LOG_FILE="$PWD/$LOGDIR/chrome_client_console.log"
npm run wdio -- --spec "$TEST"
WDIO_RESULT=$?

# Cleanup
unset HEADLESS CHROME_LOG_FILE SPECFILE
mkdir -p tests/mongodump
mongodump -h "$MONGODB_HOST" -d "$MONGODB_DB" -o ./tests/mongodump

# Archive versions
mkdir -p "$VERSIONS_DIR"
npm ls >"$VERSIONS_DIR/npm.txt"
google-chrome --version >"$VERSIONS_DIR/chrome.txt"
./node_modules/chromedriver/bin/chromedriver --version >"$VERSIONS_DIR/chrome_driver.txt"

exit "$WDIO_RESULT"
