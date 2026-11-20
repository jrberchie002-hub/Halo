#!/usr/bin/env bash
# Halo call server (coturn). Run as root on a fresh Ubuntu 22.04/24.04 VPS with a public IP.
#   curl -fsSL <this file> | bash      or:   sudo bash setup-turn.sh
# It prints the two values to paste into Vercel at the end: TURN_HOST and TURN_SECRET.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run as root (sudo bash setup-turn.sh)"; exit 1; }
IP="$(curl -4 -fsS https://api.ipify.org)"
SECRET="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 40)"
apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get install -y coturn ufw
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn || true
cat > /etc/turnserver.conf <<CONF
listening-port=3478
tls-listening-port=5349
min-port=49160
max-port=49200
external-ip=$IP
realm=halo
fingerprint
use-auth-secret
static-auth-secret=$SECRET
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
total-quota=100
bps-capacity=0
stale-nonce=600
syslog
CONF
ufw allow 22/tcp; ufw allow 3478/tcp; ufw allow 3478/udp; ufw allow 5349/tcp; ufw allow 5349/udp; ufw allow 49160:49200/udp
ufw --force enable
systemctl enable coturn && systemctl restart coturn
sleep 2; systemctl is-active coturn
echo; echo "================ Paste these into Vercel -> Settings -> Environment Variables ================"
echo "TURN_HOST   = $IP"
echo "TURN_SECRET = $SECRET"
echo "Then redeploy. In Halo: Profile -> Calls -> Test calling."
echo "(Port 5349 TLS needs a certificate; plain relay on 3478 works without one.)"
