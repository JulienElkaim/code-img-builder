#!/bin/sh
# usage: asteroid-code [project] [command...]   (default command: pi)
if [ -n "$1" ] && [ -d "/workspace/$1" ]; then cd "/workspace/$1" && shift; fi
[ $# -eq 0 ] && set -- pi
exec "$@"
