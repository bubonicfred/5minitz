#!/usr/bin/env bash

TEST="$1" # We will run these tests

echo Remove old log file
LOGDIR=./tests/end2end/logs
mkdir -p "$LOGDIR"
SERVERLOG=$LOGDIR/server.log
rm "$SERVERLOG"

echo Start end2end server
npm run test:end2end:server >"$SERVERLOG" &

COUNTER=0
MAX_WAIT=900
until grep "=> App running at" "$SERVERLOG"; do
  echo App has not started yet.. Waiting for "$COUNTER" seconds
  sleep 30
  COUNTER=$((COUNTER + 30))

  if [ "$COUNTER" -gt "$MAX_WAIT" ]; then
    echo Meteor takes too long to start, exiting. Server log:
    cat "$SERVERLOG"
    exit 1
  fi
  if grep "=> Your application has errors." "$SERVERLOG"; then
    echo Meteor reports build errors, exiting. Server log:
    cat "$SERVERLOG"
    exit 1
  fi
done
sleep 10

echo Start end2end test runner
export HEADLESS=1       # evaluated by wdio.conf.js
export CHROME_LOG_FILE="$PWD/$LOGDIR"/chrome_client_console.log
npm run wdio -- --spec "$TEST"
WDIO_RESULT=$?

unset HEADLESS CHROME_LOG_FILE SPECFILE

mkdir tests/mongodump
mongodump -h localhost:3101 -d meteor -o ./tests/mongodump

# archive versions
mkdir versions
npm ls >./versions/npm.txt
google-chrome --version >./versions/chrome.txt
./node_modules/chromedriver/bin/chromedriver --version >./versions/chrome_driver.txt

exit "$WDIO_RESULT"
