#!/bin/bash -ve

PROJECT_NAME="Sender"
FRAMEWORK_TARGET_NAME="Sender-Universal"

xcodebuild -project ${PROJECT_NAME}.xcodeproj -target ${FRAMEWORK_TARGET_NAME} -configuration Release clean build
