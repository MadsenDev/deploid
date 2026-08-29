# Deploid

**Web app in. Native Android app out. Minimal ceremony.**

Deploid is a CLI for turning an existing web app into an Android app without making Android tooling your new hobby. It handles the repetitive parts around Capacitor, Gradle, assets, devices, signing, releases, and the Android toolchain while keeping the everyday workflow deliberately small.

```bash
npm install -g @deploid/cli
cd my-web-app

deploid init
deploid run
```

`deploid init` prepares the project. `deploid run` builds it, packages it, installs the debug APK on your device, and launches it.

When it is time to release:

```bash
deploid release init
deploid ship --patch --from-git
```

That is the product: simple commands for the common path, with lower-level commands and explicit overrides when you actually need them.

---

## What Deploid handles

A web-to-Android build crosses several toolchains that are perfectly capable of failing independently. Deploid tries to make that somebody else's problem.

It can:

- detect Vite, Next.js static export, and Create React App projects
- generate and maintain the Android/Capacitor project
- run the web build and synchronize it into Capacitor
- generate Android app assets from a source logo
- resolve Java, the Android SDK, `adb`, `sdkmanager`, and the project Gradle wrapper
- validate Android build requirements before Gradle produces a wall of archaeology
- build debug APKs and signed release AABs
- discover connected Android devices and install/launch builds
- manage versions, changelogs, signing setup, CI scaffolding, and publishing workflows
- expose lower-level commands and toolchain overrides for advanced use

Deploid does **not** install random global tooling or rewrite your shell configuration behind your back. Resolution and remediation are intentionally project/process scoped where possible.

---

## The everyday workflow

### 1. Initialize

```bash
deploid init
```

Deploid detects the package manager and framework, generates `deploid.config.ts`, installs the required Capacitor dependencies, and creates the basic Android packaging configuration.

If framework detection is uncertain, Deploid asks instead of silently pretending the project is Vite. In non-interactive mode, specify it explicitly:

```bash
deploid init --yes --framework vite --app-name "My App" --app-id "com.example.myapp"
```

### 2. Run on Android

```bash
deploid run
```

`run` is the development fast path. It packages the current web app, builds the **debug** APK, selects the connected device when there is exactly one, installs the app, and launches it.

With multiple devices connected, choose one explicitly:

```bash
deploid run --device <serial>
```

List devices with:

```bash
deploid devices
```

### 3. Build without deploying

```bash
deploid build
```

`build` is self-contained: it runs the packaging/sync work it needs before invoking Gradle. It produces a debug APK and, when signing is configured, a signed release AAB.

You do not need to remember to run `deploid package` first.

### 4. Ship a release

First-time signing setup:

```bash
deploid release init
```

Then:

```bash
deploid ship --patch --from-git
```

The release workflow can coordinate versioning, Android builds, changelog generation, and configured publishing targets. Release credentials should come from environment/CI secrets rather than being committed to the repository.

---

## Android toolchain resolution

Deploid does not require a perfectly curated set of global environment variables before it can understand your machine.

For Android work it resolves tooling from, in order of intent, explicit Deploid overrides, Deploid-specific environment/configuration, standard Android/Java environment variables, project metadata such as `android/local.properties`, Android Studio installations, known OS locations, and `PATH` where appropriate.

The important bits:

- **Java 17+ is supported.** Java 21 is the preferred controlled/CI environment, not a hard minimum.
- **`ANDROID_HOME` is not mandatory** when Deploid can resolve the SDK another way.
- **Gradle comes from the project wrapper** (`gradlew` / `gradlew.bat`), not an arbitrary global Gradle installation.
- Windows-specific SDK, wrapper, and `PATHEXT` resolution is covered by targeted CI.

When you need to override discovery for one invocation:

```bash
deploid doctor --java-home /path/to/jdk --android-sdk /path/to/sdk
deploid run --java-home /path/to/jdk --android-sdk /path/to/sdk
```

The same scoped overrides are available on Android `package` and `build` commands. They affect that Deploid process only.

---

## Doctor

When Android decides today is a good day for interpretive error messages:

```bash
deploid doctor
```

Doctor inspects project setup and Android toolchain/readiness, including Java, SDK discovery, Capacitor, the Gradle wrapper, ADB, signing, and release state. It reports blockers, warnings, capabilities, and useful next actions.

```text
Deploid Doctor
Project: /home/user/my-web-app
Status: ACTION NEEDED

Workflow readiness:
  PASS Project setup
  PASS Android build
  WARN Release readiness
  PASS Device deploy
```

Safe project-local remediation is available with:

```bash
deploid doctor --fix
```

Deploid will not silently accept Android SDK licenses for you or mutate global shell/system configuration. When a global or legal/user-consent step is required, Doctor tells you what to run instead.

---

## Supported web projects

| Project | Detection | Default output |
| --- | --- | --- |
| Vite (React, Vue, Svelte, etc.) | Automatic | `dist/` |
| Next.js static export | Automatic | `out/` |
| Create React App | Automatic | `build/` |
| Static files | Explicit (`--framework static`) | `public/` |

Deploid's supported native packaging path is currently **Android via Capacitor**. Older references to Tauri/TWA packaging should not be treated as supported product paths.

---

## Requirements

- Node.js 18+
- Java 17+ for Android builds
- an Android SDK
- an Android device/emulator for `deploid run` / `deploy`

Android Studio is a convenient way to obtain the SDK and related tools, but Deploid itself is a CLI and does not require you to use Android Studio as your development environment.

Run `deploid doctor` if you are unsure what Deploid can resolve on the current machine.

---

## Common commands

The beginner surface is intentionally small:

| Command | Purpose |
| --- | --- |
| `deploid init` | Prepare a web project for Deploid/Android |
| `deploid run` | Build a debug APK, install it, and launch it |
| `deploid build` | Package/sync and compile Android artifacts |
| `deploid ship` | Run the release workflow |
| `deploid doctor` | Diagnose project and toolchain readiness |

More focused commands are available when you want control over an individual stage:

| Command | Purpose |
| --- | --- |
| `deploid assets` | Generate application assets |
| `deploid package` | Run web build + Capacitor/Android packaging |
| `deploid deploy` | Install an APK; advanced deployment can target multiple devices |
| `deploid devices` | List connected devices/emulators |
| `deploid logs` | Read Android logs through resolved ADB |
| `deploid version` | Manage application version information |
| `deploid changelog` | Generate/update release notes |
| `deploid release init` | Prepare Android signing/release configuration |
| `deploid publish` | Run a configured publishing step |
| `deploid ci init github` | Generate GitHub Actions release CI |
| `deploid artifacts` | Inspect generated artifacts |

Run `deploid --help` or a command's `--help` for the complete advanced surface.

---

## CI/CD

Deploid can generate a GitHub Actions release workflow:

```bash
deploid ci init github
```

For automation and agents, prefer explicit/non-interactive inputs rather than relying on prompts:

```bash
deploid init --yes --framework vite --app-name "My App" --app-id "com.example.myapp"
```

The repository's own CI validates the supported Node range on Linux and keeps targeted Windows coverage for path-sensitive Android toolchain resolution. Cross-platform testing exists to protect the CLI, not because Deploid secretly wants to become a desktop application again.

---

## Configuration and advanced control

Most projects should start with the generated `deploid.config.ts` and change it only when needed. Advanced users can work directly with individual pipeline stages, select devices, control signing/release behavior, or override Android toolchain locations for a single command.

Deploid is designed around one rule: **simple by default, explicit when requested**. The lower-level surface is there so automation, CI, and unusual Android setups do not have to fight the convenient defaults.

---

## Programmatic API

Deploid also exposes its core workflows for integrations that should not have to scrape terminal output:

```ts
import { runDoctorCommand, runPluginCommand, inspectArtifacts } from '@deploid/cli';

await runDoctorCommand({
  cwd: '/path/to/project',
  doctorOptions: { json: true, summary: true }
});

await runPluginCommand('build-android', { cwd: '/path/to/project' });

const artifacts = inspectArtifacts('/path/to/project');
```

`deploid daemon` provides a local HTTP integration surface for language-agnostic tooling.

---

## Plugin architecture

Internally, Deploid uses a plugin pipeline for assets, packaging, Android builds, deployment, publishing, and other stages. The built-in plugins ship with `@deploid/cli`, so normal users install one package rather than assembling the tool themselves.

Custom plugin development remains available for specialized workflows:

```bash
deploid plugin init my-custom-step
```

See [Plugin Development](docs/plugins.md) for the contract.

---

## Documentation

- [Getting Started](docs/getting-started.md)
- [Configuration Reference](docs/configuration.md)
- [CLI Reference](docs/cli-reference.md)
- [Android Troubleshooting](docs/ANDROID_TROUBLESHOOTING.md)
- [Plugin Development](docs/plugins.md)
- [Programmatic API](docs/api.md)
- [Examples](docs/examples.md)
- [Contributing](docs/contributing.md)

Some deeper documentation still predates the current CLI-first workflow. The README is the current high-level product guide while those pages are being consolidated.

---

MIT © [MadsenDev](https://github.com/MadsenDev)
