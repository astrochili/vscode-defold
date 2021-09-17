#!/bin/bash

##
## The next required files can be downloaded from https://d.defold.com/stable/
##

# The path to java. It's recommended to use java included in Defold. But you can set it to just "java".
java_path="/Applications/Defold.app/Contents/Resources/packages/jdk11.0.1-p1/bin/java"

# The path to your bob.jar for building
bob_path="/Applications/Defold.app/bob.jar"

# The path to your dmengine for running without NE
dummy_engine_path="/Applications/Defold.app/dmengine"

# (Windows) the path to OpenAL32.dll from defoldsdk/ext/lib/x86_64-win32/OpenAL32.dll
windows_openal32_path=""

# (Windows) the path to wrap_oal.dll from defoldsdk/ext/lib/x86_64-win32/wrap_oal.dll
windows_wrapoal_path=""

##
## Additional bob settings
##

# User email to resolve dependencies
email=""

# Authentication token to resolve dependencies
auth=""

# Use texture compression as specified in texture profiles
texture_compression=true

# Generate the symbol file (if applicable)
with_symbols=true

# Liveupdate content should be published
liveupdate=false

# (iOS) Path to mobileprovisioning profile
mobileprovisioning=""

# (iOS) The name of your code signing identity from Keychain
identity=""

# (Android) Which keystore file to use when signing the bundle
keystore=""

# (Android) Path to file with keystore password used to when bundling
keystore_pass=""

# (Android) Name of alias from provided keystore to use when bundling
keystore_alias=""

# (Android) Which format to generate bundle in: "apk" or "aab"
bundle_format="" 

##
cmd=$1
target=$2

function clean {
    echo "# Clean"
    echo "$ $java_path -jar $bob_path distclean"
    echo ""
    $java_path -jar $bob_path distclean
}

function resolve {
    if [ $email ]; then
        arguments="$arguments --email $email"
    fi
    if [ $auth ]; then
        arguments="$arguments --auth $auth"
    fi

    echo "# Resolve Dependencies"
    echo "$ $java_path -jar $bob_path$arguments resolve"
    echo ""
    $java_path -jar $bob_path$arguments resolve
}

function build {
    echo "# Build"
    echo "$ $java_path -jar $bob_path --variant debug build"
    echo ""
    $java_path -jar $bob_path --variant debug build
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

    echo "# Bundle for $target with architectures: $architectures"
    echo "$ $java_path -jar $bob_path $arguments resolve distclean build bundle"
    echo ""
    $java_path -jar $bob_path $arguments resolve distclean build bundle
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

    build_path="./build/$platform_build_folder"
    build_engine_path="$build_path/dmengine"
    projectc_path="./build/default/game.projectc"

    if [ -e $build_engine_path ]
    then
        # There are native extensions so the engine path is platform specific
        engine_path=$build_engine_path
    else
        # There are no native extensions so the engine path is default
        engine_path=$dummy_engine_path
    fi

    if [ $target = "Windows" ]
    then
        build_openal32_path="$build_path/OpenAL32.dll"
        if ! [ -e $build_openal32_path ]
        then
            cp $windows_openal32_path $build_openal32_path
        fi

        build_wrapoal_path="$build_path/wrap_oal.dll"
        if ! [ -e $build_wrapoal_path ]
        then
            cp $windows_wrapoal_path $build_wrapoal_path
        fi
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

    echo "# Launching"
    echo "$ $engine_path $projectc_path"
    echo ""
    $engine_path $projectc_path

    if [ $temp_folder ]
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