#!/bin/bash
# First thing the sandbox does: close its network to everything on YOUR side of the wall, then hand over to
# the unprivileged user. Allowed out: the public internet (the model, sign-in). Refused: your computer
# (host.docker.internal), the container gateway, every private / link-local range, all IPv6.
# Without this a container can reach servers you run on your own machine (e.g. a local dev API on :3000).
# If the wall cannot be built, the sandbox REFUSES to start; it never runs open.
set -e
fail() { echo "sandbox: could not close its network ($1). Start it with --cap-add NET_ADMIN (sandbox.sh does). Refusing to run open." >&2; exit 70; }
command -v iptables >/dev/null || fail "iptables missing"
RES=$(awk '/^nameserver/{print $2}' /etc/resolv.conf | grep -v : | head -3)
iptables -F OUTPUT 2>/dev/null || fail "no permission to change the firewall"
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
for r in $RES; do
  iptables -A OUTPUT -p udp -d "$r" --dport 53 -j ACCEPT
  iptables -A OUTPUT -p tcp -d "$r" --dport 53 -j ACCEPT
done
for net in 0.0.0.0/8 10.0.0.0/8 100.64.0.0/10 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12 192.168.0.0/16 192.0.0.0/24 198.18.0.0/15 240.0.0.0/4 0.250.250.0/24; do
  iptables -A OUTPUT -d "$net" ! -o lo -j REJECT --reject-with icmp-port-unreachable
done
ip6tables -F OUTPUT 2>/dev/null || true
ip6tables -A OUTPUT -o lo -j ACCEPT 2>/dev/null || true
ip6tables -P OUTPUT DROP 2>/dev/null || true
iptables -S OUTPUT | grep -q "REJECT" || fail "rules did not load"
touch /etc/sandbox-sealed
# drop every privilege; from here on nothing can undo the wall
exec setpriv --reuid=dev --regid=dev --init-groups --inh-caps=-all --bounding-set=-all \
  env HOME=/home/dev USER=dev LOGNAME=dev /usr/local/bin/enter.sh "$@"
