import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GitContextSchema } from "../schemas.js";
const STORY_ID_PATTERN = /US-\d+/;
function resolveGitRoot(startDir = process.cwd()) {
    let current = startDir;
    while (true) {
        if (existsSync(join(current, ".git"))) {
            return current;
        }
        const parent = join(current, "..");
        if (parent === current) {
            throw new Error("No git repository found in workspace hierarchy.");
        }
        current = parent;
    }
}
function readBranchFromHead(gitRoot) {
    const headPath = join(gitRoot, ".git", "HEAD");
    const headContent = readFileSync(headPath, "utf-8").trim();
    if (headContent.startsWith("ref:")) {
        const ref = headContent.replace("ref:", "").trim();
        return ref.split("/").pop() ?? ref;
    }
    return headContent.slice(0, 8);
}
function detectStoryIdFromBranch(branchName) {
    const match = branchName.match(STORY_ID_PATTERN);
    if (!match) {
        throw new Error(`Branch "${branchName}" does not contain a valid Copado User Story ID (expected US-<digits>).`);
    }
    return match[0];
}
export function resolveGitContext(cwd = process.cwd()) {
    const gitRoot = resolveGitRoot(cwd);
    const localBranch = readBranchFromHead(gitRoot);
    const detectedStoryId = detectStoryIdFromBranch(localBranch);
    return GitContextSchema.parse({ localBranch, detectedStoryId });
}
export function tryResolveGitContext(cwd = process.cwd()) {
    try {
        return resolveGitContext(cwd);
    }
    catch {
        return null;
    }
}
export function resolveGitContextViaCli(cwd = process.cwd()) {
    try {
        const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
            cwd,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        const detectedStoryId = detectStoryIdFromBranch(branch);
        return GitContextSchema.parse({ localBranch: branch, detectedStoryId });
    }
    catch {
        return resolveGitContext(cwd);
    }
}
export { STORY_ID_PATTERN };
//# sourceMappingURL=context.js.map