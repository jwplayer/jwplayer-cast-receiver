# Chromecast iOS Sender

## Building the sender

A universal framework of the sender can be built by executing `./build.sh`.
After completion the framework can be found in the Output/ folder.

## Using the sender

Add the sender library as an embedded library to your project.

## Submitting to the App Store

Before an app containing the universal sender library can be submitted to the App Store the unused architectures need to be stripped from it. This can be done using the `strip_unused_archs.sh` script. Make sure to distribute this script with SDK releases.