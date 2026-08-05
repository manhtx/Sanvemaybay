/* global console, process */
import { execFileSync } from "node:child_process";

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
if (status) {
  console.error("Deployment stopped: commit or stash all changes so GitHub and Vercel receive the same source.");
  process.exit(1);
}

const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (!branch) {
  console.error("Deployment stopped: the repository is in detached HEAD state.");
  process.exit(1);
}

run("npm", ["run", "check"]);
run("npm", ["run", "check:functions"]);
run("npm", ["run", "test:functions"]);
run("npm", ["run", "test:e2e"]);
run("git", ["push", "--set-upstream", "origin", branch]);
run("npm", ["exec", "--yes", "vercel@latest", "--", "--prod"]);
