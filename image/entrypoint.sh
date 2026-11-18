#!/bin/sh
# usage: asteroid-code [project] [command...]   (default command: pi)
# Personal files live in the mounted ~/.asteroid-code and are linked into Pi's config dir.
D=/home/node/.asteroid-code
mkdir -p "$D/sessions" "$D/skills" "$D/prompts"
for f in AGENTS.md skills prompts mcp.json; do ln -sfn "$D/$f" "/home/node/.pi/agent/$f"; done
# Models sometimes write global skills elsewhere: all these paths end up in the same persisted folder.
mkdir -p /home/node/.agents /home/node/.agent
for s in /home/node/.pi/skills /home/node/.agents/skills /home/node/.agent/skills; do ln -sfn "$D/skills" "$s"; done
if [ -n "$1" ] && [ -d "/workspace/$1" ]; then cd "/workspace/$1" && shift; fi
[ $# -eq 0 ] && set -- pi
exec "$@"
