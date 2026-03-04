# 🛡️ Registry Bouncer (NPM Registry Scanner)

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Registry%20Bouncer-blue?logo=github)](https://github.com/marketplace/actions/registry-bouncer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Registry Bouncer** is a zero-configuration GitHub Action that blocks NPM supply chain attacks by scanning your `package-lock.json` for unauthorized or rogue registries.

This action was built to defend against sophisticated Web3 and crypto-drainer malware that hide malicious packages inside deep dependency trees by bypassing the official NPM registry.

## ✨ Features

- **Zero-Config Installation:** Drop it into your workflow and it works immediately.
- **Pre-Install Execution:** Parses `package-lock.json` *without* running `npm install`, ensuring malicious `postinstall` scripts never execute on your CI runners.
- **Blocks Malicious PRs:** Immediately fails the workflow run if an unauthorized registry URL is found, preventing the code from being merged.
- **Beautiful UI Reports:** Generates a detailed Markdown table directly in your GitHub Actions Job Summary showing exactly which packages failed the check.

---

## 🚀 Usage

Using Registry Bouncer is incredibly simple. Add the following step to any of your existing GitHub Actions workflows (e.g., `.github/workflows/security.yml`).

```yaml
name: Security Checks

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  scan-lockfile:
    name: Scan Lockfile Registries
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Registry Bouncer
        uses: carlesloriente/registry-bouncer@v1.0.0

```

## ⚙️ How It Works

Attackers often use "Typo-squatting" or "Dependency Confusion" to alter a project's `package-lock.json`. They change the `resolved` URL of a common package to point to their own server (e.g., `https://scammer-server.com/malicious-package.tgz`).

When Registry Bouncer runs, it:

1. Opens your `package-lock.json` directly.
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
| `ethers-utils-core` | `http://malicious-registry.com/ethers-utils.tgz` |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://www.google.com/search?q=https://github.com/carlesloriente/registry-bouncer/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
