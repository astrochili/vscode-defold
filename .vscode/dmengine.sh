#!/bin/bash

platform=$1
dummy_engine_path=$2

build_engine_path="./build/$platform/dmengine"
projectc_path="./build/default/game.projectc"

if [ -e $build_engine_path ]
then
    # There are native extensions so the engine path is platform specific
    engine_path=$build_engine_path
else
    # There are no native extensions so the engine path is default
    engine_path=$dummy_engine_path
fi

if [ $platform = "macos" ] && [ $engine_path = $build_engine_path ]
then
    # On macOS we need to copy builded dmengine to the different folder
    # Otherwise dmengine launches inside VSCode
    # I don't know why
    temp_folder="./build/tmp"
    mkdir -p $temp_folder

    temp_engine_path="$temp_folder/dmengine"
    cp $build_engine_path $temp_engine_path
    engine_path=$temp_engine_path
fi

if [ $platform = "macos" ] || [ $platform = "linux" ]
then
chmod +x $engine_path
fi

$engine_path $projectc_path