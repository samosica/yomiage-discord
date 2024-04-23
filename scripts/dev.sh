#!/usr/bin/env bash

usage(){
    cat <<EOF
Usage: $0 [Option]...
Run application in local environment

Options:
    -h    help
EOF
}

while getopts h opt; do
    case "$opt" in
        h) usage; exit 0 ;;
        *) usage; exit 1 ;;
    esac
done

export NODE_ENV=development
npm run deploy
npm run start
