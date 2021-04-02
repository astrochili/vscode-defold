#!/bin/bash

bob_path=$1
cmd=$2

case $cmd in
    "clean")
        echo "# Clean Build"
        java -jar $bob_path distclean
        ;;
    "resolve")
        echo "# Resolve Dependencies"
        java -jar $bob_path resolve
        ;;
    "build")
        echo "# Debug Build"
        java -jar $bob_path --variant debug build
        ;;
    *)  ;;
esac