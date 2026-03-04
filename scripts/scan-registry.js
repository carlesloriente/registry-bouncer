const fs = require('fs');

// Define the registries you trust
const ALLOWED_REGISTRIES = [
  'https://registry.npmjs.org/',
  'https://npm.pkg.github.com/', // If you use GitHub Packages
  'https://registry.yarnpkg.com/' // If you use Yarn's mirror
];

try {
  console.log("🔍 Starting lockfile registry scan...");
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

  // --- Generate the "Cool Report" for GitHub Actions ---
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
  }

  // Write the markdown report to the GitHub Step Summary UI
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, reportMarkdown);
  }

  // Exit with code 1 to BLOCK the merge if unauthorized packages were found
  if (unauthorizedPackages.length > 0) {
    process.exit(1);
  }

} catch (error) {
  console.error("❌ Error scanning lockfile:", error.message);
  process.exit(1);
}