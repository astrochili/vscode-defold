#!/bin/bash

##
## General Settings
## You should probably change them

# The path to your Defold Editor folder:
# - MacOS: "/Applications/Defold.app"
# - Linux: "/usr/bin/Defold"
# - Windows: "C:/Program Files/Defold"
defold_editor_path="YOUR-DEFOLD-PATH-HERE"

# Open the output folder after completing the bundle.
open_bundle_folder=true


##
## Optional Bob Settings
## You can change them if you understand how bob works

# User email to resolve dependencies
email=""

# Authentication token to resolve dependencies
auth=""

# Use texture compression as specified in texture profiles in debug / release bundles
texture_compression_debug=false
texture_compression_release=true

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
bundle_format="apk" 


##
## Internal Variables
## You have no need to change them

# Incoming Parameters
cmd=$1
host_os=$2
target_os=$3
variant=$4
project_path="$(pwd)"

# Defold Paths
defold_recources_path="${defold_editor_path%/}"
if [ $host_os = "macOS" ]
then
    defold_recources_path="$defold_recources_path/Contents/Resources"
fi

defold_config_path="$defold_recources_path/config"
defold_editor_sha1=$(awk '/^editor_sha1/{print $3}' "$defold_config_path")

# Java Paths
jdk_path=$(awk '/^jdk/{print $3}' "$defold_config_path")
jdk_path=${jdk_path/\$\{bootstrap.resourcespath\}/"$defold_recources_path"}

java_path=$(awk '/^java/{print $3}' "$defold_config_path")
java_path=${java_path/\$\{launcher.jdk\}/"$jdk_path"}

jar_path=${java_path/bin\/java/"bin/jar"}

if [ $host_os = "Windows" ]
then
    java_path="$java_path.exe"
    jar_path="$jar_path.exe"
fi

# Bob Paths
defold_jar_path=$(awk '/^jar/{print $3}' "$defold_config_path")
defold_jar_path=${defold_jar_path/\$\{bootstrap.resourcespath\}/"$defold_recources_path"}
defold_jar_path=${defold_jar_path/\$\{build.editor_sha1\}/"$defold_editor_sha1"}

bob_class="com.dynamo.bob.Bob"


##
## Functions

# Clean
function clean {
    echo "# Clean"
    echo "$ \"$java_path\" -cp \"$defold_jar_path\" $bob_class distclean"
    echo ""
    "$java_path" -cp "$defold_jar_path" $bob_class distclean
}

# Resolve
function resolve {
    if [ $email ]; then
        arguments="$arguments --email $email"
    fi
    if [ $auth ]; then
        arguments="$arguments --auth $auth"
    fi

    echo "# Resolve Dependencies"
    echo "$ \"$java_path\" -cp \"$defold_jar_path\" $bob_class $arguments resolve"
    echo ""
    "$java_path" -cp "$defold_jar_path" $bob_class $arguments resolve
}

# Build
function build {
    echo "# Build"
    echo "$ \"$java_path\" -cp \"$defold_jar_path\" $bob_class --variant debug build"
    echo ""
    "$java_path" -cp "$defold_jar_path" $bob_class --variant debug build
}

# Bundle
function bundle {
    bundle_output="./bundle/$target_os"
    mkdir -p "$bundle_output"
    report_output="$bundle_output/build-report.html"

    case $target_os in
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

    ## General
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

    ## Variant
    case $variant in
        "Debug")
            arguments="$arguments --texture-compression $texture_compression_debug"
            arguments="$arguments --variant debug"
            ;;
        "Release")
            arguments="$arguments --texture-compression $texture_compression_release"
            arguments="$arguments --variant release"
            ;;
        *)  ;;
    esac

    ## Options
    if [ $liveupdate = true ] || [ $liveupdate = "yes" ]; then
        arguments="$arguments --liveupdate \"yes\""
    fi
    if [ $with_symbols = true ]; then
        arguments="$arguments --with-symbols"
    fi

    ## iOS
    if [ $target_os = "iOS" ]; then
        if [ $mobileprovisioning ]; then
            arguments="$arguments --mobileprovisioning \"$mobileprovisioning\""
        fi
        if [ $identity ]; then
            arguments="$arguments --identity \"$identity\""
        fi
    fi

    ## Android
    if [ $target_os = "Android" ]; then
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

    echo "# Bundle for $target_os with architectures: $architectures"
    echo "$ \"$java_path\" -cp \"$defold_jar_path\" $bob_class $arguments resolve distclean build bundle"
    echo ""
    mkdir -p $bundle_output
    "$java_path" -cp "$defold_jar_path" $bob_class $arguments resolve distclean build bundle

    if [ $open_bundle_folder = true ]; then
        case $host_os in
            "macOS")
                open $bundle_output
                ;;
            "Linux")
                nautilus $bundle_output
                ;;
            "Windows")
                start $bundle_output
                ;;
            *)  ;;
        esac
    fi
}

# Deploy
function deploy {
    case $target_os in
        "iOS")
            deploy="ios-deploy -b"
            bundle_extension="ipa"
            ;;
        "Android")
            deploy="adb install"
            bundle_extension=$bundle_format
            ;;
        *)  ;;
    esac

    bundle_output="./bundle/$target_os"
    bundle_file=$(find "$bundle_output" -type f -name "*.$bundle_extension")

    echo "# Deploy for $target_os"
    echo "$ $deploy $bundle_file"
    echo ""
    $deploy "$bundle_file"
}

# Launch
function launch {
    case $host_os in
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
    engine_path="$build_path/dmengine"
    projectc_path="./build/default/game.projectc"
    temp_folder="./build/temp"

    mkdir -p "$temp_folder"

    if ! [ -e "$engine_path" ]
    then
        # There are no native extensions so let's copy the engine from Defold
        mkdir -p "$build_path"
        
        # Extract dmengine from Defold Editor.
        case $host_os in
            "macOS")
                defold_dmengine_path="_unpack/x86_64-darwin/bin/dmengine"
                ;;
            "Windows")
                defold_dmengine_path="_unpack/x86_64-win32/bin/dmengine.exe"
                ;;
            "Linux")
                defold_dmengine_path="_unpack/x86_64-linux/bin/dmengine"
                ;;
            *)  ;;
        esac

        cd "$temp_folder"
        "$jar_path" -xf "$defold_jar_path" "$defold_dmengine_path"
        cd "$project_path"
        cp "$temp_folder/$defold_dmengine_path" "$engine_path"
        rm -rf "_unpack"
    fi

    if [ $host_os = "Windows" ]
    then
        build_openal32_path="$build_path/OpenAL32.dll"
        if ! [ -e "$build_openal32_path" ]
        then
            defold_openal32_path="_unpack/x86_64-win32/bin/OpenAL32.dll"
            cd "$temp_folder"
            "$jar_path" -xf "$defold_jar_path" "$defold_openal32_path"
            cd "$project_path"
            cp "$temp_folder/$defold_openal32_path" "$build_openal32_path"
            rm -rf "_unpack"
        fi

        build_wrapoal_path="$build_path/wrap_oal.dll"
        if ! [ -e "$build_wrapoal_path" ]
        then
            defold_wrapoal_path="_unpack/x86_64-win32/bin/wrap_oal.dll"
            cd "$temp_folder"
            "$jar_path" -xf "$defold_jar_path" "$defold_wrapoal_path"
            cd "$project_path"
            cp "$temp_folder/$defold_wrapoal_path" "$build_wrapoal_path"
            rm -rf "_unpack"
        fi
    fi

    if [ $host_os = "macOS" ]
    then
        # On macOS we need to copy builded dmengine to the different folder
        # Otherwise dmengine launches inside VSCode
        # I don't know why
        temp_engine_path="$temp_folder/dmengine"
        cp "$engine_path" "$temp_engine_path"
        engine_path="$temp_engine_path"
    fi

    if [ $host_os = "macOS" ] || [ $host_os = "Linux" ]
    then
        chmod +x "$engine_path"
    fi

    echo "# Launching"
    echo "$ $engine_path $projectc_path"
    echo ""
    "$engine_path" "$projectc_path"

    if [ "$temp_folder" ]
    then
        rm -rf "$temp_folder"
    fi
}

##
## Just run the incoming command

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
    "deploy")
        deploy
        ;;
    "launch")
        launch
        ;;
    *)  ;;
esac