const fs = require('fs');
const { execSync } = require('child_process');

// Define the registries you trust
const ALLOWED_REGISTRIES = [
  'https://registry.npmjs.org/',
  'https://npm.pkg.github.com/', 
  'https://registry.yarnpkg.com/' 
];

try {
  console.log("🔍 Starting lockfile registry scan...");

  // 1. Check if lockfile exists
  if (!fs.existsSync('package-lock.json')) {
    console.log("⏭️ No package-lock.json found. Skipping scan.");
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## 🛡️ NPM Registry Security Scan\n⏭️ **Skipped:** No \`package-lock.json\` found in this repository.`);
    }
    process.exit(0);
  }

  // 2. Parse the lockfile
  const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  const unauthorizedPackages = []; // <-- This was the missing variable!
  let totalScanned = 0;

  if (lockfile.packages) {
    for (const [path, details] of Object.entries(lockfile.packages)) {
      if (!path) continue; // Skip the root project

      if (details.resolved && !details.link) {
        totalScanned++;
        const isAllowed = ALLOWED_REGISTRIES.some(reg => details.resolved.startsWith(reg));
        
        if (!isAllowed) {
          const cleanName = path.replace(/^.*node_modules\//, '');
          unauthorizedPackages.push({ name: cleanName, resolved: details.resolved });
        }
      }
    }
  }

  // 3. Generate the Markdown Report
  let reportMarkdown = `## 🛡️ NPM Registry Security Scan\n\n`;
  reportMarkdown += `**Total Packages Scanned:** ${totalScanned}\n`;

  if (unauthorizedPackages.length === 0) {
    reportMarkdown += `✅ **Status:** Passed. All packages are resolved from trusted registries.\n`;
    console.log("✅ Scan passed!");
  } else {
    reportMarkdown += `❌ **Status:** Failed! Found packages from unauthorized registries.\n\n`;
    reportMarkdown += `### 🚨 Unauthorized Packages Detected\n`;
    reportMarkdown += `| Package Name | Resolved URL |\n`;
    reportMarkdown += `| :--- | :--- |\n`;
    
    unauthorizedPackages.forEach(pkg => {
      reportMarkdown += `| \`${pkg.name}\` | \`${pkg.resolved}\` |\n`;
      console.error(`🚨 Unauthorized registry found for package: ${pkg.name} -> ${pkg.resolved}`);
    });

    // 4. Handle GitHub Pages Reporting (if enabled)
    const shouldCreateReport = process.env.INPUT_CREATE_PAGES_REPORT === 'true';

    if (shouldCreateReport) {
      console.log("📝 'create_pages_report' is enabled. Generating blog post...");
      
      const date = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();
      const frontMatter = `---
layout: post
title: "🚨 Security Alert: Rogue NPM Registry Blocked"
date: ${timestamp}
categories: security-alert
---

A supply chain attack attempt was automatically blocked by **Registry Bouncer**.

${reportMarkdown}
`;
      if (!fs.existsSync('_posts')) fs.mkdirSync('_posts');
      const fileName = `_posts/${date}-rogue-registry-blocked-${Date.now()}.md`;
      fs.writeFileSync(fileName, frontMatter);
      
      try {
        console.log("🚀 Committing report to the repository...");
        execSync('git config --global user.name "Registry Bouncer Bot"');
        execSync('git config --global user.email "actions@github.com"');
        execSync('git add _posts/');
        execSync('git commit -m "🚨 Security Advisory: Automated malware report added"');
        execSync('git push');
        console.log("✅ Successfully committed report to GitHub Pages!");
      } catch (error) {
        console.error("⚠️ Failed to commit automatically. Did you add 'permissions: contents: write' to your workflow?");
      }
    }
  }

  // 5. Output to GitHub Actions UI
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, reportMarkdown);
  }

  // 6. Block the PR if malware is found
  if (unauthorizedPackages.length > 0) {
    process.exit(1);
  }

} catch (error) {
  console.error("❌ Error scanning lockfile:", error.message);
  process.exit(1);
}
