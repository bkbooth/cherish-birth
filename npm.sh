#!/bin/bash

# Always pull latest image
docker pull node:slim

docker run \
    --rm -it \
    --name=npm-$(( $RANDOM % 99999 )) \
    -v $(pwd):/code \
    -w "/code" \
    node:slim npm --quiet ${*}
