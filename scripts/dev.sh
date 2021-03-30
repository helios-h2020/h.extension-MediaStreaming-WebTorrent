#!/usr/bin/env sh

PUBLIC_FOLDER=./public


scripts/generate-video.sh &

npm run build:dev
scripts/start.sh
