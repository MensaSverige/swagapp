#!/bin/bash

# Check if the platform is macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # Create .xcode.env.local file and set NODE_BINARY
  echo -n export NODE_BINARY= > ios/.xcode.env.local
  which node >> ios/.xcode.env.local

  # Convert Info.plist to XML format
  plutil -convert xml1 ios/swagapp/Info.plist

  # Install CocoaPods dependencies
  npx pod-install

  # Convert Info.plist back to XML format
  plutil -convert xml1 ios/swagapp/Info.plist
fi