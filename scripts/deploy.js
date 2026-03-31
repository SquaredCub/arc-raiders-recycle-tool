import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const NC = "\x1b[0m";

const updateLastUpdatedDate = () => {
  const appFile = "src/App.tsx";
  const content = readFileSync(appFile, "utf-8");
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const date = `${day}/${month}/${year}`;
  const updated = content.replace(
    /("general\.lastUpdated"\)}\s*)\d{2}\/\d{2}\/\d{4}/,
    `$1${date}`
  );
  writeFileSync(appFile, updated, "utf-8");
  console.log(`${GREEN}Updated last updated date to ${date}.${NC}`);
};

const run = (cmd) => {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
};

const ask = (question) =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

console.log("");
console.log("=========================================");
console.log("  Running tests before deploy...");
console.log("=========================================");
console.log("");

const failures = [];

console.log(`${YELLOW}Running unit tests (Jest)...${NC}`);
if (run("npx jest --silent")) {
  console.log(`${GREEN}Unit tests passed.${NC}`);
} else {
  console.log(`${RED}Unit tests failed.${NC}`);
  failures.push("Unit tests (Jest)");
}

console.log("");

console.log(`${YELLOW}Running e2e tests (Playwright)...${NC}`);
if (run("npx playwright test --project=chromium --reporter=list")) {
  console.log(`${GREEN}E2E tests passed.${NC}`);
} else {
  console.log(`${RED}E2E tests failed.${NC}`);
  failures.push("E2E tests (Playwright)");
}

console.log("");

if (failures.length === 0) {
  console.log(`${GREEN}All tests passed. Proceeding with deploy.${NC}`);
  console.log("");
  updateLastUpdatedDate();
  if (!run("npm run build && npx gh-pages -d dist --no-history")) {
    process.exit(1);
  }
} else {
  console.log(`${RED}=========================================${NC}`);
  console.log(`${RED}  WARNING: Test failures detected${NC}`);
  console.log(`${RED}=========================================${NC}`);
  for (const f of failures) {
    console.log(`${RED}  - ${f}${NC}`);
  }
  console.log("");
  const answer = await ask("Deploy anyway? (y/N): ");
  if (answer.match(/^[Yy]$/)) {
    console.log("");
    console.log("Deploying despite test failures...");
    updateLastUpdatedDate();
    if (!run("npm run build && npx gh-pages -d dist --no-history")) {
      process.exit(1);
    }
  } else {
    console.log("Deploy aborted.");
    process.exit(1);
  }
}
