# 🛡️ Registry Bouncer (NPM Security Scanner)

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Registry%20Bouncer-blue?logo=github)](https://github.com/marketplace/actions/registry-bouncer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Registry Bouncer** is a zero-configuration GitHub Action that blocks NPM supply chain attacks by scanning your `package-lock.json` for unauthorized or rogue registries.

This action was built to defend against sophisticated Web3 and crypto-drainer malware that hide malicious packages inside deep dependency trees by bypassing the official NPM registry.

## ✨ Features

- **Zero-Config Installation:** Drop it into your workflow and it works immediately.
- **Pre-Install Execution:** Parses `package-lock.json` *without* running `npm install`, ensuring malicious `postinstall` scripts never execute on your CI runners.
- **Blocks Malicious PRs:** Immediately fails the workflow run if an unauthorized registry URL is found, preventing the code from being merged.
- **Beautiful UI Reports:** Generates a detailed Markdown table directly in your GitHub Actions Job Summary showing exactly which packages failed the check.
- **[NEW] Automated Security Advisories:** Can automatically generate and commit a GitHub Pages blog post detailing the blocked attack to your repository's `_posts` directory!

---

## 🚀 Usage

### 1. Basic Setup (Scan & Block)

To simply scan your lockfile and block malicious PRs, add this to your workflow (e.g., `.github/workflows/security.yml`):

```yaml
name: Security Checks

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  scan-lockfile:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Registry Bouncer
        uses: carlesloriente/registry-bouncer@v1.1.0

```

### 2. Advanced Setup (Auto-Publish Security Advisories to GitHub Pages)

If you want Registry Bouncer to automatically write and commit a blog post to your GitHub Pages `_posts` folder when malware is caught, use this configuration:

```yaml
name: Security Checks

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

# REQUIRED: Give Registry Bouncer permission to commit the report
permissions:
  contents: write

jobs:
  scan-lockfile:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          # REQUIRED: Forces Git to checkout the actual branch to avoid Detached HEAD errors
          ref: ${{ github.head_ref || github.ref }} 

      - name: Run Registry Bouncer
        uses: carlesloriente/registry-bouncer@v1.1.0
        with:
          create_pages_report: 'true'

```

---

## ⚙️ Inputs

| Input | Description | Required | Default |
| --- | --- | --- | --- |
| `create_pages_report` | Set to `'true'` to automatically commit a Jekyll/GitHub Pages Markdown report to the `_posts/` directory when malware is found. | No | `'false'` |

---

## ⚙️ How It Works

Attackers often use "Typo-squatting" or "Dependency Confusion" to alter a project's `package-lock.json`. They change the `resolved` URL of a common package to point to their own server (e.g., `https://scammer-server.com/malicious-package.tgz`).

When Registry Bouncer runs, it:

1. Checks if a `package-lock.json` exists (if not, it safely skips).
2. Extracts every `resolved` URL for your entire dependency tree.
3. Checks the URLs against a strict whitelist of trusted package registries (NPM, Yarn, GitHub Packages).
4. Exits with code `1` (blocking the merge) if an unknown registry is detected.

---

## 📊 Example Output

When a malicious package is detected, Registry Bouncer creates a report in your **GitHub Actions Step Summary**:

### 🚨 Unauthorized Packages Detected

❌ **Status:** Failed! Found packages from unauthorized registries.

| Package Name | Resolved URL |
| --- | --- |
| `keccak256-helper` | `https://untrusted-domain.net/keccak256-helper-1.3.2.tgz` |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/carlesloriente/registry-bouncer/issues) if you want to contribute.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
