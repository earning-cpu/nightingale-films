#!/usr/bin/env bash
# build_v3.sh — grade, mux, ladder, vertical for "72 SECONDS" v3.
# FILTER ORDER CHANGE vs v2: grain now runs AFTER the upscale, so it is 1 px at
# delivery size (film grain) instead of a 1.67 px soft blob scaled up from the
# 60 % render. That was one of the "looks cheap" tells.
set -euo pipefail
cd "$(dirname "$0")"

RAW=${1:-qa3/raw3.mp4}
MIX=public/wow_mix_v3_norm.mp3
MASTER=qa3/v3_master.mp4

GRADE="scale=out_range=tv:out_color_matrix=bt709:flags=lanczos,format=yuv420p"
GRADE="$GRADE,scale=1920:1080:flags=lanczos,setsar=1"
GRADE="$GRADE,curves=all='0/0.028 0.25/0.284 0.5/0.514 0.75/0.742 1/0.986'"
GRADE="$GRADE,eq=contrast=1.0:saturation=0.92:gamma=1.03"
GRADE="$GRADE,noise=alls=9:allf=t+u"
GRADE="$GRADE,drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill"
GRADE="$GRADE,drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill"
GRADE="$GRADE,format=yuv420p"

echo "== master =="
ffmpeg -y -v error -i "$RAW" -i "$MIX" \
  -filter_complex "[0:v]$GRADE[v]" \
  -map "[v]" -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 6000k -bufsize 12000k \
  -profile:v high -level 4.1 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv" \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart "$MASTER"

echo "== ladder =="
ffmpeg -y -v error -i "$MASTER" -c:v libx264 -preset slow -crf 24 -maxrate 3200k \
  -bufsize 6400k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart docs/wow3_1080.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow \
  -crf 25 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart docs/wow3_720.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=854:480:flags=lanczos -c:v libx264 -preset slow \
  -crf 26 -maxrate 1100k -bufsize 2200k -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart docs/wow3_480.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=640:360:flags=lanczos -c:v libx264 -preset slow \
  -crf 28 -maxrate 650k -bufsize 1300k -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart docs/wow3_360.mp4

echo "== 9:16 =="
VF="[0:v]crop=1920:912:0:84,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=60:3,eq=brightness=0.10:saturation=1.4[bg];[0:v]crop=1920:912:0:84,scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
ffmpeg -y -v error -i "$MASTER" -filter_complex "$VF" -map "[v]" -map 0:a -c:v libx264 \
  -preset slow -crf 21 -maxrate 3600k -bufsize 7200k -pix_fmt yuv420p -c:a aac -b:a 160k \
  -movflags +faststart docs/wow3_vertical_1080.mp4
ffmpeg -y -v error -i docs/wow3_vertical_1080.mp4 -vf scale=720:1280:flags=lanczos -c:v libx264 \
  -preset slow -crf 25 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 128k \
  -movflags +faststart docs/wow3_vertical_720.mp4
ffmpeg -y -v error -ss 3 -i "$MASTER" -frames:v 1 -q:v 3 docs/wow3_poster.jpg
ls -la docs/wow3_*
