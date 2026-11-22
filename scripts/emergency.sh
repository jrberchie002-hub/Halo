#!/bin/sh
# EMERGENCY ONLY: ship a Halo Chat screen update through Halo Music when Vercel says "Deployment rate limited".
# Usage: scripts/emergency.sh on   (publishes public/app.js to ../halo-music/chat and turns the channel on)
#        scripts/emergency.sh off  (turns it off; do this once the normal chat deploy is live)
# After it, commit and push ../halo-music only.
set -e
M=../halo-music/chat; mkdir -p $M
if [ "$1" = "off" ]; then echo '{"on":false}' > $M/emergency.json; echo "emergency off"; exit 0; fi
CODE=$(grep -o "CODE = '[0-9.]*'" public/app.js | head -1 | grep -o "[0-9.]*")
cp public/app.js $M/app.js
echo "{\"on\":true,\"code\":\"$CODE\",\"js\":\"https://halo-music.vercel.app/chat/app.js\"}" > $M/emergency.json
echo "emergency on, code $CODE. Now commit and push halo-music."
