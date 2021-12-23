#!/bin/bash
IMG=$1
NEW=$2
if [ -z "$IMG" ]
then
    IMG="lastday:dev"
fi
if [ ! -z "$NEW" ]
then 
    sudo docker build . -t $IMG
fi
sudo docker run --volume $(pwd):/app -p 8000:8000 -it $IMG