## 🛠️ Project Summary — Shipwright

**Goal:**
Create a **unified build-to-publish toolchain** for web apps (React, Vite, Next.js) that turns them into Android apps (APK/AAB) and optionally publishes them to the Play Store or GitHub — all through one simple CLI.

---

### 🎯 Mission

> “From build to publish — one command.”

Shipwright automates the entire process of turning a web app into a ready-to-ship Android package.

It replaces the fragmented manual steps (Capacitor, Gradle, Bubblewrap, Fastlane, icons, screenshots, signing, etc.) with one consistent workflow.

---

### ⚙️ Core Features (v1–v2 roadmap)

#### 🧱 1. Initialization

* Detects framework (Vite / Next / CRA / static).
* Creates base project structure for Capacitor, Tauri, or TWA.
* Generates default config file: `shipwright.config.ts`.

#### 🖼️ 2. Asset generation

* Input: one logo (`logo.svg` or `logo.png`).
* Output:

  * Android mipmap icons (all densities).
  * PWA icons (maskable + standard).
  * Web favicons and manifest updates.
  * Optional store listing screenshots (auto-rendered via Puppeteer).
* Generates `assets-gen/` and patches manifest files automatically.

#### 🧩 3. Packaging (choose engine)

* **Capacitor** → wraps React/Vite build into native Android WebView.
* **Tauri Mobile** → smaller binary, Rust backend.
* **TWA (Trusted Web Activity)** → PWA → APK using Bubblewrap.

Auto-detects your app type and suggests the right packaging option.

#### 🔍 4. Audit

* PWA validation: manifest, SW, HTTPS, icons, theme color.
* Android validation: min/target SDK, permissions, ABI, versionCode bump, etc.
* Store-readiness checks (screenshots, descriptions, feature graphics).
* Outputs report with autofix suggestions.

#### 🔑 5. Signing

* Generate or load Android keystore.
* Create `gradle.properties` securely.
* Support env vars for CI/CD (`ANDROID_STORE_PWD`, etc).

#### 🏗️ 6. Build

* Build web app → package → Gradle assemble.
* Produces:

  * `app-debug.apk` (for testing)
  * `app-release.aab` / `.apk` (for Play Store)
* Output path: `dist/android/`

#### ☁️ 7. Publish

* **Play Console** (via Fastlane or Bubblewrap for TWA)

  * Upload to internal/testing/production track.
* **GitHub Releases**

  * Attach APK/AAB and changelog to draft release.

#### ⚙️ 8. CI/CD Automation

* `shipwright ci` → generates ready GitHub Action for full pipeline:

  * Build web
  * Generate assets
  * Package
  * Sign + build + release
  * Upload to GitHub or Play

#### 🧠 9. Extensible Plugin System

Each step is a pluggable module. Example:

```
plugins:
  - assets
  - audit
  - packaging-capacitor
  - sign-android
  - publish-play
```

Easy to add new ones (e.g., “expo”, “electron”, “ios”, “web-publish”).

---

### 📁 Project Structure

```
shipwright/
  packages/
    cli/                     # Command line interface
    core/                    # config loader, logger, pipeline runner
    plugins/
      assets/                # icon/screenshot generation
      audit/                 # PWA + Android audit
      packaging-capacitor/
      packaging-tauri/
      packaging-twa/
      sign-android/
      publish-play/
      publish-github/
  templates/
    capacitor/
    tauri/
    twa/
    github-actions/
    fastlane/
  examples/
    vite-react/
    next-export/
  docs/
```

---

### 📜 Example Config

```ts
import { defineConfig } from 'shipwright';

export default defineConfig({
  appName: 'MyApp',
  appId: 'com.madsen.myapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: { manifest: 'public/manifest.json', serviceWorker: true },
  },
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA'],
    signing: {
      keystorePath: './android.keystore',
      alias: 'mykey',
      storePasswordEnv: 'ANDROID_STORE_PWD',
      keyPasswordEnv: 'ANDROID_KEY_PWD',
    },
    version: { code: 5, name: '1.0.4' },
  },
  assets: {
    source: 'branding/logo.svg',
    output: 'assets-gen/',
  },
  publish: {
    play: { track: 'internal', serviceAccountJson: 'secrets/play.json' },
    github: { repo: 'Chris/Shipwright', draft: true },
  },
});
```

---

### 🧩 Command Overview

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `shipwright init`    | Setup config and base folders               |
| `shipwright assets`  | Generate all required icons and screenshots |
| `shipwright audit`   | Validate project readiness                  |
| `shipwright package` | Wrap app for Android (Capacitor/Tauri/TWA)  |
| `shipwright sign`    | Create or load signing keys                 |
| `shipwright build`   | Build APK/AAB (debug/release)               |
| `shipwright debug`   | Add network debugging tools                  |
| `shipwright publish` | Upload build to Play Store or GitHub        |
| `shipwright ci`      | Generate GitHub Action pipeline             |

---

### 🧠 Tech Stack

* **Language:** TypeScript (Node.js)
* **Package Manager:** pnpm (monorepo)
* **Libraries:** commander, execa, sharp, fs-extra, inquirer, puppeteer
* **Optional:** Rust (for Tauri backend), Fastlane CLI for publishing
* **Output:** Works cross-platform (Linux, macOS, Windows)

---

### 🚀 Roadmap

**Milestone 1 — Core CLI + Capacitor**

* Config loader + basic CLI
* Assets (icons)
* Capacitor packaging
* Debug APK build

**Milestone 2 — Release + CI**

* Signing + release builds
* Play/GitHub publishing
* Auto GitHub Actions generator

**Milestone 3 — TWA & Tauri**

* Add TWA (Bubblewrap) and Tauri support
* PWA audit + store readiness report
* Screenshot automation

**Milestone 4 — Polish**

* Docs site (VitePress)
* “Store-ready” score system
* CLI branding + logo

---

### 🧭 Vision

Shipwright should make it possible to:

> “Turn any web app into a publishable Android app with one command — including icons, signing, builds, and release automation.”

The long-term goal:
Expand to **multi-platform** (Windows .exe, macOS DMG, iOS IPA, and Web Deploy).

---

### ✅ TL;DR for Cursor AI

* Project name: **Shipwright**
* Type: **Modular CLI toolchain** (TypeScript monorepo)
* Purpose: **Automate build → package → sign → publish for web apps to Android**
* Targets: **Vite / React / Next.js apps**
* Includes:

  * Icon/screenshot generation
  * Packaging (Capacitor / Tauri / TWA)
  * PWA + Android audit
  * Signing system
  * Build system
  * Play Store / GitHub publishing
  * GitHub Action CI generator
* Expandable via **plugins** and **config file**