import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const CYAN = "\x1b[0;36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

const logStep = (msg) =>
  console.log(`\n${CYAN}${BOLD}==>${NC} ${BOLD}${msg}${NC}`);
const logSuccess = (msg) => console.log(`${GREEN}  ✓ ${NC}${DIM}${msg}${NC}`);
const logError = (msg) => console.log(`${RED}  ✗ ${NC}${BOLD}${msg}${NC}`);

// --ci: non-interactive mode — test failures block the deploy, no override prompt
const CI = process.argv.includes("--ci");

const updateLastUpdatedDate = () => {
  const appFile = "src/App.tsx";
  const content = readFileSync(appFile, "utf-8");
  const date = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY

  const updated = content.replace(
    /("general\.lastUpdated"\)}\s*)\d{2}\/\d{2}\/\d{4}/,
    `$1${date}`,
  );

  writeFileSync(appFile, updated, "utf-8");
  logSuccess(`Updated build date to ${date}`);
};

const ask = async (question) => {
  process.stdout.write(`\n${YELLOW}${BOLD}?${NC} ${question}`);
  for await (const line of console) return line.trim();
};

console.log(`\n${BOLD}ARC RAIDERS RECYCLE TOOL - DEPLOY PIPELINE${NC}`);
console.log(`${DIM}--------------------------------------------${NC}`);

const failures = [];

// 1. Type Check
logStep("Type Checking (TSC)");
try {
  await $`bun x tsc`.quiet();
  logSuccess("No type errors found");
} catch (err) {
  logError("TypeScript validation failed");
  failures.push("TypeScript");
}

// 2. Unit Tests
logStep("Unit Tests (Bun)");
try {
  const result = await $`bun test src --reporter=dot`.quiet();
  // Extract just the summary line (e.g., "120 pass, 0 fail")
  const summary = result.stdout
    .toString()
    .split("\n")
    .find((l) => l.includes("pass"));
  logSuccess(summary?.trim() || "All unit tests passed");
} catch (err) {
  console.log(err.stdout.toString()); // Show failures
  logError("Unit tests failed");
  failures.push("Unit Tests");
}

// 3. E2E Tests
logStep("E2E Tests (Playwright)");
try {
  await $`bun x playwright test --project=chromium`.quiet();
  logSuccess("All E2E scenarios passed");
} catch (err) {
  logError("Playwright tests failed");
  failures.push("E2E Tests");
}

const performDeploy = async () => {
  console.log(`\n${YELLOW}${BOLD}STARTING DEPLOYMENT${NC}`);
  console.log(`${DIM}-------------------${NC}`);

  updateLastUpdatedDate();

  try {
    logStep("Building Assets");
    await $`bun run build`.quiet();
    logSuccess("Vite build complete (dist/)");

    logStep("Publishing to GH Pages");
    await $`bun x gh-pages -d dist --no-history`.quiet();
    logSuccess("Successfully pushed to GitHub");

    logStep("Post-Deploy Asset Audit");
    await $`bun scripts/check-missing-images.js`;
  } catch (err) {
    console.error(`\n${RED}${BOLD}FATAL ERROR during deployment${NC}`);
    if (err.stdout?.length) console.error(err.stdout.toString());
    if (err.stderr?.length) console.error(err.stderr.toString());
    else if (!err.stdout?.length) console.error(err);
    process.exit(1);
  }
};

// Logic Flow
if (failures.length === 0) {
  await performDeploy();
} else {
  console.log(`\n${RED}${BOLD}PRE-DEPLOYMENT FAILED${NC}`);
  failures.forEach((f) => console.log(`  ${RED}•${NC} ${f}`));

  if (CI) {
    console.log(`\n${DIM}Deployment cancelled (--ci: no override).${NC}`);
    process.exit(1);
  }

  const answer = await ask("Ignore failures and deploy anyway? (y/N): ");
  if (answer.toLowerCase() === "y") {
    await performDeploy();
  } else {
    console.log(`\n${DIM}Deployment cancelled.${NC}`);
    process.exit(1);
  }
}
