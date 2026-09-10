# Chess Website contributor guide

## Repository layout

This repository does not use a root npm workspace or a root `package.json`.
Run npm commands from the individual project directory that owns the command.

- `interfaces/web/` is the primary browser client: a Create React App (React
  and TypeScript) single-page chess UI. It is the application published to
  GitHub Pages.
- `libs/chess_game/` is the reusable TypeScript chess-rules package
  (`@sean_halpin/chess_game`). Its source is under `src/chess_game/`; compiled
  JavaScript and declarations are written to `dist/` and `types/`.
- `interfaces/mobile_react_native/` is the native React Native client, with
  Android and iOS projects under `android/` and `ios/`.
- `interfaces/mobile_expo/` is the Expo-based mobile client.
- `models/` contains model-development notebooks and related material.
- `media/` contains screenshots used by the repository documentation.

The `main` branch is the source of truth for this layout and for the published
website. Keep website work focused in `interfaces/web/` and chess-rules work
in `libs/chess_game/` unless a change deliberately spans clients.

## Setup and local development

Each JavaScript/TypeScript project has its own lockfile. From the relevant
directory, install its pinned dependencies with `npm ci` (or `npm install` if
intentionally updating dependencies).

### Web application

```sh
cd interfaces/web
npm ci
npm start
```

`npm start` launches the Create React App development server. It includes
`NODE_OPTIONS=--openssl-legacy-provider` in the repository script for its
current toolchain compatibility.

Useful checks from `interfaces/web/`:

```sh
npm test                         # CRA/Jest test runner (watch mode)
CI=true npm test -- --watchAll=false  # one non-interactive test run
npm run lint
npm run build
```

The web UI has component tests under `src/components/tests/`. Static assets
belong in `public/`; React components and styles live in `src/`.

### Chess-game package

```sh
cd libs/chess_game
npm ci
npm test
npm run build
npm run lint
```

The package uses Jest with `ts-jest`; logic tests are in
`src/chess_game/tests/`. `npm run build` runs TypeScript and produces ignored
`dist/` and `types/` output. Use `npm run test:coverage` when coverage is
needed.

### Mobile clients

For the native React Native app:

```sh
cd interfaces/mobile_react_native
npm ci
npm start
npm test
npm run lint
npm run android  # Android toolchain/emulator required
npm run ios      # macOS, Xcode, and iOS simulator required
```

For the Expo app:

```sh
cd interfaces/mobile_expo
npm ci
npm start
npm run android
npm run ios
npm run web
npm test
```

Do not run mobile end-to-end commands unless the required device/emulator and
their supporting tooling are available; they are environment-dependent.

## Build and publish the GitHub Pages site

The published URL is
`https://sean-halpin.github.io/chess_website/`. Its base path is configured by
the `homepage` value in `interfaces/web/package.json`.

Before publishing, work from a clean branch with credentials that can push to
the repository. Run the normal checks, then deploy from the web directory:

```sh
cd interfaces/web
CI=true npm test -- --watchAll=false
npm run lint
npm run deploy
```

`npm run deploy` first runs `predeploy`, which runs `npm run build`, then
publishes `build/` through the `gh-pages` package. GitHub Pages must be
configured in the repository settings to serve the `gh-pages` branch from its
root directory. After the push and Pages propagation, load the published URL
and verify that assets and chess-board interaction work under the
`/chess_website/` path.

### Important deployment safeguard

The current web `build` script is:

```sh
react-scripts build && npm version patch
```

Consequently, both `npm run build` and `npm run deploy` are state-changing:
they patch the version in package metadata and may create a Git commit and
tag. Do not use either command as a read-only validation step. Start from a
clean working tree, inspect `git status`, `git log -1`, and any created tag
afterward, and commit or push the intended version change according to the
release workflow before considering the deployment complete.
