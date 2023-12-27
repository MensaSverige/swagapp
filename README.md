<p align="center">
<img src="https://img.shields.io/github/v/release/skaramicke/swagapp">
<img src="https://img.shields.io/github/issues/skaramicke/swagapp">
<img src="https://img.shields.io/github/issues-pr/skaramicke/swagapp">
<img src="https://img.shields.io/github/license/skaramicke/swagapp">
</p>

<p align="center">
<img src="https://github.com/skaramicke/swagapp/actions/workflows/publish-android.yml/badge.svg">
<img src="https://github.com/skaramicke/swagapp/actions/workflows/publish-website.yml/badge.svg">
<img src="https://github.com/skaramicke/swagapp/actions/workflows/publish-backend.yml/badge.svg">
</p>

<h1 align="center">📱 SWAG Communicator</h1>

SWAG is a mobile and web application designed exclusively for Mensa Sweden members, offering a suite of features including location tracking, event management, and community interaction. It encompasses a React Native mobile app, a Python-based backend service, and a dedicated website.

## Features

- Cross-platform mobile application compatible with Android and iOS.
- Robust backend services leveraging Docker for efficient deployment.
- A dedicated website hosted at [https://swag.mikael.green](https://swag.mikael.green).

# 1 Components

## 1.1 📱 Apps

Developed in TypeScript using React Native, these mobile apps cater to the specific needs of Mensa Sweden's annual gathering.

<p align="center">
  <img src="./fastlane/screenshots/Simulator Screenshot - iPhone 8 Plus - 1.png" width="32%">
  <img src="./fastlane/screenshots/Simulator Screenshot - iPhone 8 Plus - 2.png" width="32%">
  <img src="./fastlane/screenshots/Simulator Screenshot - iPhone 8 Plus - 3.png" width="32%">
</p>

> These screenshots are of the iOS app. The Android app is virtually identical.

### 1.1.1 🤖 Android

The Android app's deployment is automated through GitHub Actions, including steps like setting the build version, code checkout, `.env` file creation, JDK and Node.js setup, dependencies installation, Android App Bundle building and signing, and uploading the signed APK. This is followed by creating and publishing a release on GitHub.

### 1.1.2 🍎 iOS

Managed manually by Mikael, the iOS app deployment includes steps such as screenshotting, build generation, testing, and App Store submission, ensuring compliance with Apple's guidelines.

## 1.2 🐍 Backend

The Python backend is the cornerstone of SWAG, orchestrating user interactions and data processing. It plays a crucial role in authentication, event management, and location services. This backend is designed to be scalable, secure, and efficient, ensuring a seamless user experience.

The backend has documentation on [the wiki](https://github.com/skaramicke/swagapp/wiki/backend).

**Endpoints:**

- `/api/health`: Performs a system health check.
- `/api/auth`: Handles user authentication.
- `/api/refresh_token`: Manages token refresh functionalities.
- `/api/user`: Manages user data, with `/api/user/me` specifically for authorized users.
- `/api/event`: Manages event-related data for users.
- `/api/static_events`: Provides static event data stored as a JSON file.
- `/api/users_showing_location`: Handles user location data.
- `/api/update_location`: Manages user location updates.

### 1.2.1 `server.py`

This script is central to backend operations, managing token-based authentication, CRUD operations, JSON schema validation, and user-specific data like events and locations.

### 1.2.2 `auth.py`

Responsible for user authentication against Mensa Sweden's member system and handling a review user account for iOS app testing.

### 1.2.3 `token_processing.py`

Focuses on the generation and management of access and refresh tokens.

For more detailed information on Python backend development, refer to [Python's official documentation](https://docs.python.org/3/).

## 1.3 💻 Website

### 1.3.1 Main Website

The main website ([swag.mikael.green](https://swag.mikael.green)) serves as a landing page, providing app download links for both iOS and Android users, directly linking to the App Store and the latest GitHub release, respectively.

### 1.3.2 API

The website also features a proxy ([swag.mikael.green/api](https://swag.mikael.green/api)) that routes API requests to the backend service. For more information on web proxies and Nginx, see [Nginx's official documentation](https://nginx.org/en/docs/).

# 2 👩‍💻 Development Environment

Whether you're a developer or simply a curious Mensa Sweden member, here's how you can get involved with SWAG.

## 2.1 Environment Setup

Create a `.env` file based on provided examples to configure the application. This file is automatically populated by the start scripts.

## 2.2 Running the Application

Utilize these scripts in `package.json`:

- `yarn start`: Launches the app in test mode with fake auth requests.
- `yarn start:notest`: Runs with local backend and real auth.
- `yarn start:prod`: Connects to the production backend.

For more on using Yarn in your projects, visit [Yarn's documentation](https://yarnpkg.com/getting-started).

## 2.3 Other Yarn Scripts

- `android`: Initiates the app on Android devices. You can also just hit `a` in the Metro Bundler you get from `yarn start`.
- `ios`: Initiates the app on iOS devices. You can also just hit `i` in the Metro Bundler you get from `yarn start`.
- `lint`: Runs ESLint for code linting.
- `test`: Executes Jest for testing.
- `prebuild`: Preps for build with type generation and icon set creation.
- `generate-types`: Generates TypeScript types from JSON schema.
- `generate-icons`: Creates icons from specified images.
- `cc`: Clears React Native config.

For more on React Native, check out [React Native's documentation](https://reactnative.dev/docs/getting-started).

## 2.4 Backend Service

Deploy using Docker Compose with the command:  
`docker-compose up`

> Mikael prefers  
> `docker-compose up -d && docker-compose logs -f`  
> so he can use ctrl+c to do other things in the terminal without stopping the containers.

Learn more about Docker Compose at [Docker's official site](https://docs.docker.com/compose/).

## 2.5 Website and API

Access the website at [https://swag.mikael.green](https://swag.mikael.green), with the backend API under `/api/`.

### 2.5.1 Nginx Configuration

The Nginx server is configured to proxy API requests through `/api/` and `/db`, serving static content from `/usr/share/nginx/html`, optimizing content delivery and security.

## 3 ❤️ Contributing

Your contributions are valuable! Fork the repository, make your changes, and submit a pull request to be a part of SWAG's development.

### 3.2 Nice routines

#### 3.2.1 Starting a new iteration

1. Create a new branch from `develop` with the name `feature/short-description`.

```bash
git fetch # get the latest upstream
git checkout develop
git pull
git checkout -b feature/short-description
```

2. Run `yarn` to get any new dependencies.
3. For iOS, run `cd ios && pod install && cd ..` to generate the iOS part of any new dependencies.
4. Run `yarn start` to start the app in test mode.
5. Make your changes.
6. Run `yarn lint` to check for linting errors.
7. Run `yarn test` to check for test errors.
8. Run `make test` to run the backend tests. (this will be in `yarn test` soon)
9. Commit your changes, using the 'unwritten "this commit will" prefix' format; `Add <feature>`, `Fix <bug>`, `Update <feature>`, etc.  
   Yes, capital first letter and no period at the end. Add a newline and a more detailed description if needed. VSCode will let you know when it's too long.
10. Push your branch to your fork.
11. Create a pull request to `develop` from your branch.

> Perhaps it's overkill to use feature branches in a fork, but that's how we work within the main repo. It's also a good way to keep your fork clean.

#### 3.2.2 After changing shcema definitions

1. Run `yarn generate-types` to generate TypeScript types from JSON schema.

#### 3.2.3 GPT Code Review

If you have access to ChatGPT 4 or some other code expert AI, you can use it to review your own code before submitting a pull request. This is a great way to catch bugs and to avoid weird patterns.

_[Mikael likes using this React Native Coder GPT](https://chat.openai.com/g/g-lEIBHv4Oj-react-native-coder)_

It's a good idea to remind the AI that it's Typescript, and to focus on readability and maintainability.

> Note: This is just for funsies. Humans are very capable at code review too.

### 3.2 Code standards

These are just a suggestion at this point:

1. Prefer chained promises over await. For many it's easy to read, and it's easier to add a sensible catch block and to parallelize many steps and still have a finally block.

### 3.3 Coder's Coding Code of Conduct for Cool Code

SWAG is committed to fostering a welcoming community. Please review and abide by these behavioral guidelines:

1. Be respectful and considerate of others.
2. Refrain from using inappropriate language.
3. Don't refactor a lot of other people's code without asking them first. You might know what they're working on.
4. At the same time, don't see a pull request as a personal attack. It's more of a suggestion.
5. When merging changes from one user that changes another user's code, make sure the other user is aware.
6. Don't judge the value of other user's contributions. People build stuff because they value them, and value is subjective.
7. Don't be afraid to ask for help. We're all here to learn and grow.

> The Coder's Coding Code of Conduct for Cool Code is also up for discussion and improvement. If you have any suggestions for modifications, please submit a pull request.

## 4 📃 License

SWAG is proudly licensed under the MIT License.

## 5 About this README

This README is in need of breaking up into parts. It's quite long and hard to get an overview of. It's also quickly going to be in need of a lot of updates. It's will forever be a work in progress.
