#!/bin/bash

## Required Paths
bob_path="/Applications/Defold.app/bob.jar"
dummy_engine_path="/Applications/Defold.app/dmengine"

## Resolving Settings
email="" ## User email for resolving dependencies.
auth="" ## Authentication token for resolving dependencies.

## Bundle Settings
texture_compression=true
with_symbols=true ## Generate the symbol file (if applicable)
liveupdate=false ## true if liveupdate content should be published.

## iOS Bundle
mobileprovisioning="" ## Path to mobileprovisioning profile (iOS).
identity="" ## The name of your code signing identity from Keychain

## Android Bundle
keystore="" ## Which keystore file to use when signing the Android bundle.
keystore_pass="" ## Path to file with keystore password used to when bundling for Android.
keystore_alias="" ## Name of alias from provided keystore to use when bundling for Android.
bundle_format="" ## "apk" or "aab"

##
cmd=$1
target=$2

function clean {
    echo "# Clean"
    java -jar $bob_path distclean
}

function resolve {
    if [ $email ]; then
        arguments="$arguments --email $email"
    fi
    if [ $auth ]; then
        arguments="$arguments --auth $auth"
    fi

    echo "# Resolve Dependencies"
    java -jar $bob_path$arguments resolve
}

function build {
    echo "# Build"
    java -jar $bob_path --variant debug build
}

function bundle {
    bundle_output="./bundle/$target"
    mkdir -p $bundle_output
    report_output="$bundle_output/build-report.html"

    case $target in
        "iOS")
            platform="armv7-darwin"
            architectures="armv7-darwin,arm64-darwin"
            ;;
        "Android")
            platform="armv7-android"
            architectures="armv7-android,arm64-android"
            ;;
        "macOS")
            platform="x86_64-darwin"
            architectures="x86_64-darwin"
            ;;
        "Windows")
            platform="x86_64-win32"
            architectures="x86_64-win32"
            ;;
        "Linux")
            platform="x86_64-linux"
            architectures="x86_64-linux"
            ;;
        "HTML5")
            platform="js-web"
            architectures="js-web,wasm-web"
            ;;
        *)  ;;
    esac

    arguments="--archive"
    arguments="$arguments --platform \"$platform\""
    arguments="$arguments --architectures \"$architectures\""
    arguments="$arguments --bundle-output \"$bundle_output\""
    arguments="$arguments --build-report-html \"$report_output\""


    ## Dependencies
    if [ $email ]; then
        arguments="$arguments --email \"$email\""
    fi
    if [ $auth ]; then
        arguments="$arguments --auth \"$auth\""
    fi

    ## General
    if [[ $texture_compression ]]; then
        arguments="$arguments --texture-compression $texture_compression"
    fi
    if [ $liveupdate = true ] || [ $liveupdate = "yes" ]; then
        arguments="$arguments --liveupdate \"yes\""
    fi
    if [ $with_symbols = true ]; then
        arguments="$arguments --with-symbols"
    fi

    ## iOS
    if [ $target = "iOS" ]; then
        if [ $mobileprovisioning ]; then
            arguments="$arguments --mobileprovisioning \"$mobileprovisioning\""
        fi
        if [ $identity ]; then
            arguments="$arguments --identity \"$identity\""
        fi
    fi

    ## Android
    if [ $target = "Android" ]; then
        if [ $keystore ]; then
            arguments="$arguments --keystore \"$keystore\""
        fi
        if [ $keystore_pass ]; then
            arguments="$arguments --keystore-pass \"$keystore_pass\""
        fi
        if [ $keystore_alias ]; then
            arguments="$arguments --keystore-alias \"$keystore_alias\""
        fi
        if [ $bundle_format ]; then
            arguments="$arguments --bundle-format \"$bundle_format\""
        fi
    fi

    # echo $arguments
    echo "# Bundle for $target with architectures: $architectures"
    java -jar $bob_path $arguments resolve distclean build bundle
}

function launch {
    case $target in
        "macOS")
            platform_build_folder="x86_64-osx"
            ;;
        "Linux")
            platform_build_folder="x86_64-linux"
            ;;
        "Windows")
            platform_build_folder="x86_64-win32"
            ;;
        *)  ;;
    esac

    build_engine_path="./build/$platform_build_folder/dmengine"
    projectc_path="./build/default/game.projectc"

    if [ -e $build_engine_path ]
    then
        # There are native extensions so the engine path is platform specific
        engine_path=$build_engine_path
    else
        # There are no native extensions so the engine path is default
        engine_path=$dummy_engine_path
    fi

    if [ $target = "macOS" ] && [ $engine_path = $build_engine_path ]
    then
        # On macOS we need to copy builded dmengine to the different folder
        # Otherwise dmengine launches inside VSCode
        # I don't know why
        temp_folder="./build/temp"
        mkdir -p $temp_folder

        temp_engine_path="$temp_folder/dmengine"
        cp $build_engine_path $temp_engine_path
        engine_path=$temp_engine_path
    fi

    if [ $target = "macOS" ] || [ $target = "Linux" ]
    then
        chmod +x $engine_path
    fi

    # echo "# Launching $engine_path"
    $engine_path $projectc_path

    if ! [ $temp_folder = "" ]
    then
        rm -rf $temp_folder
    fi
}

case $cmd in
    "clean")
        clean
        ;;
    "resolve")
        resolve
        ;;
    "build")
        build
        ;;
    "bundle")
        bundle
        ;;
    "launch")
        launch
        ;;
    *)  ;;
esac