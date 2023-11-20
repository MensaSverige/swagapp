# SWAG App Fastlane Configuration

This repository contains the Fastlane configuration for the SWAG App. Fastlane is a powerful tool that automates many of the tedious tasks related to building and releasing iOS apps.

## Overview

The Fastlane configuration is defined in the `Fastfile`. This file contains several "lanes" which are sequences of actions that Fastlane will execute in order.

The versioning system used in this project is based on the date, formatted as `YYYY.MM.DD`. This ensures that each publishable build has a unique version number.

## Lanes

There are several lanes defined in the `Fastfile`:

- `update_version`: This lane updates the version of the app to the current date.
- `staging_build`: This lane increments the build number and builds the app in the 'Staging' configuration.
- `release`: This lane creates a new version of the app in App Store Connect, delivers the metadata to App Store Connect, builds the app in the 'Release' configuration, and uploads the build to App Store Connect.
- `beta`: This lane runs the `staging_build` and `update_version` lanes, uploads the build to TestFlight, and pushes the changes to the git remote.

## Usage

To run a lane, use the `fastlane` command followed by the name of the lane. For example, to run the `beta` lane, you would use the following command:

```bash
fastlane beta
```

Please ensure that you have the latest version of Fastlane installed and that you're on the master branch with a clean working directory before running any lanes.
