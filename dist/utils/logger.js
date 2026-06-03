const COPADO_GLOW = "\x1b[38;2;0;195;239m";
const ABYSS_BLACK = "\x1b[38;2;10;10;11m";
const AMBER = "\x1b[38;2;255;184;77m";
const DIM_GRAY = "\x1b[38;2;77;77;77m";
const WHITE = "\x1b[97m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const BADGE_ICONS = {
    PLAN: "📋",
    BUILD: "⚡",
    TEST: "🧪",
    OPERATE: "🔧",
    SYSTEM: "◆",
    SUCCESS: "✓",
    WARNING: "⚠",
};
function badgeColor(agent) {
    switch (agent) {
        case "WARNING":
            return AMBER;
        case "SUCCESS":
            return COPADO_GLOW;
        case "OPERATE":
            return AMBER;
        default:
            return COPADO_GLOW;
    }
}
export function renderActionBadge(agent, label) {
    const icon = BADGE_ICONS[agent];
    const color = badgeColor(agent);
    const padded = label.toUpperCase().padEnd(38, " ");
    return `${color}${BOLD}[ ${icon} COPADO ${padded} ]${RESET}`;
}
export function logInfo(message) {
    process.stderr.write(`${DIM_GRAY}  │ ${RESET}${message}\n`);
}
export function logHttp(method, path, status) {
    const statusLabel = status !== undefined
        ? status >= 400
            ? `${AMBER}${status}${RESET}`
            : `${COPADO_GLOW}${status}${RESET}`
        : `${DIM}···${RESET}`;
    process.stderr.write(`${DIM_GRAY}  │ ${RESET}${DIM}${method.padEnd(6)}${RESET} ${path} ${statusLabel}\n`);
}
export function logMilestone(message) {
    process.stderr.write(`${COPADO_GLOW}${BOLD}  ► ${message}${RESET}\n`);
}
export function logWarningBlock(title, body) {
    const line = "─".repeat(58);
    process.stderr.write(`\n${AMBER}${BOLD}  ┌${line}┐${RESET}\n`);
    process.stderr.write(`${AMBER}${BOLD}  │ ${title.padEnd(57)}│${RESET}\n`);
    process.stderr.write(`${AMBER}${BOLD}  ├${line}┤${RESET}\n`);
    for (const row of body.split("\n")) {
        process.stderr.write(`${AMBER}  │ ${row.padEnd(57)}│${RESET}\n`);
    }
    process.stderr.write(`${AMBER}${BOLD}  └${line}┘${RESET}\n\n`);
}
export function logSuccessBlock(message) {
    const line = "─".repeat(58);
    process.stderr.write(`\n${COPADO_GLOW}${BOLD}  ┌${line}┐${RESET}\n`);
    process.stderr.write(`${COPADO_GLOW}${BOLD}  │ ${message.padEnd(57)}│${RESET}\n`);
    process.stderr.write(`${COPADO_GLOW}${BOLD}  └${line}┘${RESET}\n\n`);
}
export function renderBootDashboard(gitBranch, storyId) {
    const storyLine = storyId ? storyId : "— not detected —";
    const banner = `
${ABYSS_BLACK}${COPADO_GLOW}${BOLD}
  ╔══════════════════════════════════════════════════════════╗
  ║           COPADO NEXUS  ·  MCP ORCHESTRATION HUB         ║
  ╚══════════════════════════════════════════════════════════╝
${RESET}
${DIM_GRAY}  Local Workspace ────────────────── Copado Context Hub${RESET}
${DIM_GRAY}       │                                      │${RESET}
${WHITE}       ├─ Git Branch: ${gitBranch.padEnd(28)}${RESET}
${WHITE}       ├─ Story ID:   ${storyLine.padEnd(28)}${RESET}
${COPADO_GLOW}       └─ Transport:  Stdio JSON-RPC  ◄──►  Agentia /v1${RESET}
`;
    process.stderr.write(banner);
    process.stderr.write(`\n${renderActionBadge("SYSTEM", "NEXUS SERVER ONLINE")}\n\n`);
}
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export class Spinner {
    label;
    interval = null;
    frameIndex = 0;
    constructor(label) {
        this.label = label;
    }
    start() {
        if (this.interval)
            return;
        this.interval = setInterval(() => {
            const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length];
            this.frameIndex += 1;
            process.stderr.write(`\r${COPADO_GLOW}  ${frame} ${this.label}${RESET}${" ".repeat(10)}`);
        }, 80);
    }
    stop(finalMessage) {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        process.stderr.write("\r" + " ".repeat(60) + "\r");
        if (finalMessage) {
            logMilestone(finalMessage);
        }
    }
}
export function formatDiagnosisOutput(diagnosis) {
    return [
        renderActionBadge("OPERATE", "AUTONOMOUS DIAGNOSIS READY"),
        "",
        diagnosis,
        "",
        `${AMBER}Would you like the IDE agent to apply the suggested patch?${RESET}`,
    ].join("\n");
}
export function formatToolResult(agent, title, details) {
    const rows = Object.entries(details)
        .map(([key, value]) => `| ${key} | ${value} |`)
        .join("\n");
    return [
        renderActionBadge(agent, `${agent} AGENT COMPLETE`),
        "",
        `**${title}**`,
        "",
        "| Field | Value |",
        "| --- | --- |",
        rows,
    ].join("\n");
}
//# sourceMappingURL=logger.js.map