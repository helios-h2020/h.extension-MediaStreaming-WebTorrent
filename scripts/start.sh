#!/usr/bin/env sh

BIN=$PWD/node_modules/.bin
PUBLIC_FOLDER=./public


mkdir -p $PUBLIC_FOLDER
cp config.json $PUBLIC_FOLDER
cd $PUBLIC_FOLDER

$BIN/wt-tracker
