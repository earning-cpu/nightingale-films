#!/usr/bin/env bash
# build_v4.sh — grade, halation, mux, ladder, vertical for "72 SECONDS" v4.
#
# DIFFERENCE vs v3: the grade is no longer just a lift. It is now a proper
# three-stage finish:
#   1  technical   bt709, lanczos upscale from the 60 % render, 1920x1080
#   2  look        curve lift (soft blacks) + gamma + saturation, then
#                  HALATION: highlights split off, blurred, tinted red-orange
#                  and screened back. On film this is light bouncing inside the
#                  base; digitally it is the single most "shot on film" move.
#   3  texture     grain AFTER the upscale so it is 1 px at delivery size,
#                  then the 84 px letterbox drawn last so the grade can never
#                  grey the bars.
set -euo pipefail
cd "$(dirname "$0")"

RAW=${1:-qa4/raw4.mp4}
MIX=public/wow_mix_v4_norm.mp3
MASTER=qa4/v4_master.mp4

BASE="scale=out_range=tv:out_color_matrix=bt709:flags=lanczos,format=yuv420p"
BASE="$BASE,scale=1920:1080:flags=lanczos,setsar=1"
BASE="$BASE,curves=all='0/0.020 0.22/0.238 0.5/0.520 0.78/0.800 1/0.985'"
BASE="$BASE,eq=contrast=1.06:saturation=0.94:gamma=1.02"

# halation: bright areas bloom warm, everything else is untouched
GLOW="colorlevels=rimin=0.72:gimin=0.72:bimin=0.72,gblur=sigma=22"
GLOW="$GLOW,colorbalance=rs=0.42:gs=0.06:bs=-0.24"
HAL="[0:v]$BASE,format=gbrp[base];"
HAL="$HAL[base]split[keep][glow];"
HAL="$HAL[glow]$GLOW[bloom];"
HAL="$HAL[keep][bloom]blend=all_mode=screen:all_opacity=0.17[hal];"
HAL="$HAL[hal]noise=alls=8:allf=t+u,"
HAL="$HAL""drawbox=x=0:y=0:w=iw:h=84:color=black:t=fill,"
HAL="$HAL""drawbox=x=0:y=ih-84:w=iw:h=84:color=black:t=fill,"
HAL="$HAL""format=yuv420p[v]"

echo "== master =="
ffmpeg -y -v error -i "$RAW" -i "$MIX" \
  -filter_complex "$HAL" \
  -map "[v]" -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 6000k -bufsize 12000k \
  -profile:v high -level 4.1 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv" \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart "$MASTER"

echo "== ladder =="
ffmpeg -y -v error -i "$MASTER" -c:v libx264 -preset slow -crf 24 -maxrate 3200k \
  -bufsize 6400k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart docs/wow4_1080.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow \
  -crf 25 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart docs/wow4_720.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=854:480:flags=lanczos -c:v libx264 -preset slow \
  -crf 26 -maxrate 1100k -bufsize 2200k -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart docs/wow4_480.mp4
ffmpeg -y -v error -i "$MASTER" -vf scale=640:360:flags=lanczos -c:v libx264 -preset slow \
  -crf 28 -maxrate 650k -bufsize 1300k -pix_fmt yuv420p -c:a aac -b:a 64k -movflags +faststart docs/wow4_360.mp4

echo "== 9:16 =="
VF="[0:v]crop=1920:912:0:84,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=60:3,eq=brightness=0.10:saturation=1.4[bg];[0:v]crop=1920:912:0:84,scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
ffmpeg -y -v error -i "$MASTER" -filter_complex "$VF" -map "[v]" -map 0:a -c:v libx264 \
  -preset slow -crf 21 -maxrate 3600k -bufsize 7200k -pix_fmt yuv420p -c:a aac -b:a 160k \
  -movflags +faststart docs/wow4_vertical_1080.mp4
ffmpeg -y -v error -i docs/wow4_vertical_1080.mp4 -vf scale=720:1280:flags=lanczos -c:v libx264 \
  -preset slow -crf 25 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -c:a aac -b:a 128k \
  -movflags +faststart docs/wow4_vertical_720.mp4
ffmpeg -y -v error -ss 3.2 -i "$MASTER" -frames:v 1 -q:v 3 docs/wow4_poster.jpg
ls -la docs/wow4_*
