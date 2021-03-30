#!/usr/bin/env sh

PUBLIC_FOLDER=./public


cp config.json $PUBLIC_FOLDER
cd $PUBLIC_FOLDER

wt-tracker
