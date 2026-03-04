const fs = require('fs');
const { execSync } = require('child_process'); // NEW: Import this to run Git commands

// ... (keep the top part of your script the same) ...

  if (unauthorizedPackages.length === 0) {
    reportMarkdown += `✅ **Status:** Passed. All packages are resolved from trusted registries.\n`;
    console.log("✅ Scan passed!");
  } else {
    reportMarkdown += `❌ **Status:** Failed! Found packages from unauthorized registries.\n\n`;
    // ... (keep the table generation the same) ...

    // --- NEW: Check the parameter to see if we should create a report ---
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

`;
      if (!fs.existsSync('_posts')) fs.mkdirSync('_posts');
      const fileName = `_posts/${date}-rogue-registry-blocked-${Date.now()}.md`;
      fs.writeFileSync(fileName, frontMatter + reportMarkdown);
      
      // Run the Git commands directly from inside the Action!
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

  // Write to GitHub Actions UI
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, reportMarkdown);
  }

  // Exit with code 1 to BLOCK the merge
  if (unauthorizedPackages.length > 0) {
    process.exit(1);
  }

try {
  console.log("🔍 Starting lockfile registry scan...");

  // --- NEW: Check if the lockfile exists first ---
  if (!fs.existsSync('package-lock.json')) {
    console.log("⏭️ No package-lock.json found. Skipping scan.");
    
    // Write a nice summary so the user knows it was skipped, not broken
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## 🛡️ NPM Registry Security Scan\n⏭️ **Skipped:** No \`package-lock.json\` found in this repository.`);
    }
    
    process.exit(0); // Exit successfully so the workflow stays green!
  }

  // If it exists, proceed with parsing...
  const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  const unauthorizedPackages = [];
  let totalScanned = 0;

  // package-lock.json v2 and v3 use the "packages" object
  if (lockfile.packages) {
    for (const [path, details] of Object.entries(lockfile.packages)) {
      if (!path) continue; // Skip the root project itself

      // Only check packages that are resolved remotely
      if (details.resolved && !details.link) {
        totalScanned++;
        const isAllowed = ALLOWED_REGISTRIES.some(reg => details.resolved.startsWith(reg));
        
        if (!isAllowed) {
          // Extract the clean package name from the node_modules path
          const cleanName = path.replace(/^.*node_modules\//, '');
          unauthorizedPackages.push({ name: cleanName, resolved: details.resolved });
        }
      }
    }
  }

// --- Generate the "Cool Report" ---
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
    });

    // --- NEW: Create a GitHub Pages Blog Post ---
    const date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const timestamp = new Date().toISOString();
    
    // Jekyll Front Matter (Metadata for GitHub Pages)
    const frontMatter = `---
layout: post
title: "🚨 Security Alert: Rogue NPM Registry Blocked"
date: ${timestamp}
categories: security-alert
---

A supply chain attack attempt was automatically blocked by **Registry Bouncer**.

`;
    // Create the _posts directory if it doesn't exist
    if (!fs.existsSync('_posts')) {
      fs.mkdirSync('_posts');
    }

    // Save the file (e.g., _posts/2026-03-04-rogue-registry-blocked.md)
    const fileName = `_posts/${date}-rogue-registry-blocked-${Date.now()}.md`;
    fs.writeFileSync(fileName, frontMatter + reportMarkdown);
    console.log(`📝 Blog post generated at: ${fileName}`);
  }

  // Write to GitHub Actions UI
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, reportMarkdown);
  }

  // Exit with code 1 to BLOCK the merge
  if (unauthorizedPackages.length > 0) {
    process.exit(1);
  }

} catch (error) {
  console.error("❌ Error scanning lockfile:", error.message);
  process.exit(1);
}
