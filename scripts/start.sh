#!/usr/bin/env sh

BIN=$PWD/node_modules/.bin
PUBLIC_FOLDER=./public


cp config.json $PUBLIC_FOLDER
cd $PUBLIC_FOLDER

$BIN/wt-tracker
