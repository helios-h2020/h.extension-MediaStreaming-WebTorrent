#!/usr/bin/env sh

HLS_FOLDER=./public/hls


rm -rf $HLS_FOLDER
mkdir -p $HLS_FOLDER

node_modules/ffmpeg-static/ffmpeg \
  -f lavfi \
    -i testsrc=size=1280x720:rate=30 \
    -c:v libx264 -crf 20 -g 60 -sc_threshold 0 \
  -f hls \
    -hls_flags delete_segments \
    -hls_list_size 5 \
    -hls_time 10 \
  $HLS_FOLDER/%v.m3u8
