#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildPackage, planStory, resolveWorkspaceForStory, runTest, } from "./api/client.js";
import { handleApiExecution, handlePipelineFailure, isFailureStatus } from "./api/errors.js";
import { resolveGitContextViaCli, tryResolveGitContext } from "./git/context.js";
import { BuildPackageInputSchema, PlanStoryInputSchema, RunTestInputSchema, } from "./schemas.js";
import { formatToolResult, logMilestone, logSuccessBlock, renderActionBadge, renderBootDashboard, Spinner, } from "./utils/logger.js";
const SERVER_NAME = "copado-nexus";
const SERVER_VERSION = "1.0.0";
function textContent(text) {
    return { content: [{ type: "text", text }] };
}
async function main() {
    const gitContext = tryResolveGitContext();
    renderBootDashboard(gitContext?.localBranch ?? process.cwd(), gitContext?.detectedStoryId ?? null);
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });
    server.registerTool("copado_plan_story", {
        title: "Copado Plan Story",
        description: "Invoke the Copado Plan Agent to refine user story scope, acceptance criteria, and implementation guidance.",
        inputSchema: PlanStoryInputSchema.shape,
    }, async (rawInput) => {
        const input = PlanStoryInputSchema.parse(rawInput);
        const git = tryResolveGitContext();
        logMilestone(`Planning story ${input.storyId}`);
        const result = await handleApiExecution(() => planStory(input.storyId, input.userPrompt, git?.localBranch));
        if (typeof result === "string") {
            return textContent(result);
        }
        if (isFailureStatus(result.status)) {
            const diagnosis = await handlePipelineFailure({
                storyId: input.storyId,
                agent: "Plan",
                status: result.status,
                errors: result.errors ?? [],
                message: result.message,
            });
            return textContent(diagnosis);
        }
        return textContent(formatToolResult("PLAN", "Plan Agent Dialogue Complete", {
            "Story ID": input.storyId,
            "Dialogue ID": result.id,
            Status: result.status,
            Agent: result.agent,
            Message: result.message ?? "Story planning completed successfully.",
        }));
    });
    server.registerTool("copado_build_package", {
        title: "Copado Build Package",
        description: "Deploy or validate metadata components against the Copado pipeline via the Build Agent. Golden Path entry point for branch deployments.",
        inputSchema: BuildPackageInputSchema.shape,
    }, async (rawInput) => {
        const input = BuildPackageInputSchema.parse(rawInput);
        const git = tryResolveGitContext();
        logMilestone(`${input.validateOnly ? "Validating" : "Deploying"} ${input.metadataComponents.length} component(s) for ${input.storyId}`);
        const result = await handleApiExecution(() => buildPackage(input.storyId, input.metadataComponents, input.validateOnly, git?.localBranch));
        if (typeof result === "string") {
            return textContent(result);
        }
        if (isFailureStatus(result.status)) {
            const diagnosis = await handlePipelineFailure({
                storyId: input.storyId,
                agent: "Build",
                status: result.status,
                components: input.metadataComponents,
                errors: result.errors ?? [],
                message: result.message,
                payload: result.payload,
            });
            return textContent(diagnosis);
        }
        logSuccessBlock("Build pipeline milestone reached — package compiled");
        return textContent(formatToolResult("BUILD", "Build Agent Package Result", {
            "Story ID": input.storyId,
            "Dialogue ID": result.id,
            Status: result.status,
            Agent: result.agent,
            Mode: input.validateOnly ? "Validate Only" : "Full Deploy",
            Components: input.metadataComponents.join(", "),
            Message: result.message ?? "Package compilation succeeded.",
        }));
    });
    server.registerTool("copado_run_test", {
        title: "Copado Run Test",
        description: "Execute a robotic test suite in the target Salesforce environment via the Copado Test Agent.",
        inputSchema: RunTestInputSchema.shape,
    }, async (rawInput) => {
        const input = RunTestInputSchema.parse(rawInput);
        const git = tryResolveGitContext();
        const spinner = new Spinner(`Copado Test Agent executing suite ${input.testSuiteId} in ${input.executionEnvironment}`);
        spinner.start();
        logMilestone(renderActionBadge("TEST", "TEST AGENT INITIATED"));
        const result = await handleApiExecution(() => runTest(input.workspaceId, input.testSuiteId, input.executionEnvironment, git?.detectedStoryId, git?.localBranch));
        spinner.stop();
        if (typeof result === "string") {
            return textContent(result);
        }
        if (isFailureStatus(result.status)) {
            const diagnosis = await handlePipelineFailure({
                workspaceId: input.workspaceId,
                testSuiteId: input.testSuiteId,
                environment: input.executionEnvironment,
                agent: "Test",
                status: result.status,
                errors: result.errors ?? [],
                message: result.message,
            });
            return textContent(diagnosis);
        }
        logSuccessBlock("Test execution initiated — pipeline clear");
        return textContent(formatToolResult("TEST", "Test Agent Execution Status", {
            "Workspace ID": input.workspaceId,
            "Test Suite ID": input.testSuiteId,
            Environment: input.executionEnvironment,
            "Dialogue ID": result.id,
            Status: result.status,
            Agent: result.agent,
            Message: result.message ?? "Test suite is running.",
        }));
    });
    await initializeContextBridge();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
async function initializeContextBridge() {
    try {
        const context = resolveGitContextViaCli();
        logMilestone(`Context bridge active — ${context.detectedStoryId} mapped to branch ${context.localBranch}`);
        const orgId = process.env.COPADO_ORG_ID;
        if (!orgId) {
            logMilestone("Workspace API skipped — set COPADO_ORG_ID to enable story-to-workspace mapping");
            return;
        }
        const workspace = await resolveWorkspaceForStory(orgId, context.detectedStoryId);
        if (workspace) {
            const workspaceLabel = String(workspace.name ?? workspace.id ?? "resolved");
            logMilestone(`Workspace mapped — ${context.detectedStoryId} → ${workspaceLabel}`);
        }
        else {
            logMilestone(`Workspace lookup complete — no matching workspace for ${context.detectedStoryId}`);
        }
    }
    catch {
        logMilestone("Context bridge idle — no Copado story ID detected on current branch");
    }
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\n[FATAL] Copado Nexus failed to start: ${message}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map