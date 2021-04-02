#!/bin/bash

bob_path=$1
cmd=$2
platform=$3

case $cmd in
    "clean")
        echo "# Clean"
        java -jar $bob_path distclean
        ;;
    "resolve")
        echo "# Resolve Dependencies"
        java -jar $bob_path resolve
        ;;
    "build")
        echo "# Build"
        java -jar $bob_path --variant debug build
        ;;
    "bundle")
        echo "# Bundle for $platform"
        echo "#"
        echo "# Bundling isn't automatically supported at the moment because there are too many bundle options."
        echo "# Please edit bundle arguments in .vscode/bob.sh for you purposes or just use the Defold Editor instead."
        # java -jar $bob_path --archive --platform $platform resolve distclean build bundle
        ;;
    *)  ;;
esac