#!/usr/bin/env sh

PUBLIC_FOLDER=./public


rm -rf $PUBLIC_FOLDER

scripts/generate-video.sh &

npm run build:dev
scripts/start.sh
