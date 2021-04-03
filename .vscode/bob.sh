#!/bin/bash

bob_path=$1
cmd=$2
architecture=$3
texture_compression=$4

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
        echo "# Bundle for $architecture"
        bundle_output="./bundle/$architecture"
        mkdir -p $bundle_output
        report_output="$bundle_output/build-report.html"

        if [ $architecture = "arm64-darwin" ]
        then
            platform="armv7-darwin"
        elif [ $architecture = "arm64-android" ]
        then
            platform="armv7-android"
        else
            platform=$architecture
        fi

        java -jar $bob_path --archive --platform $platform --architectures $architecture --texture-compression $texture_compression --bundle-output $bundle_output --build-report-html $report_output resolve distclean build bundle
        ;;
    *)  ;;
esac