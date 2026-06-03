import { AGENT_DIALOGUE_TYPES, DialogueResponseSchema, } from "../schemas.js";
import { getSecureToken } from "../security.js";
import { logHttp, logInfo, logWarningBlock, renderActionBadge, } from "../utils/logger.js";
const AGENT_BADGE_MAP = {
    Plan: "PLAN",
    Build: "BUILD",
    Test: "TEST",
    Operate: "OPERATE",
};
const DEFAULT_API_BASE = "https://copadogpt-api.robotic.copado.com";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2000;
const AGENT_ASSISTANT_MAP = {
    Plan: "plan",
    Build: "build",
    Test: "test",
    Operate: "operate",
};
async function fetchWithRetry(url, options, label) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.status >= 500 && attempt < MAX_RETRIES) {
                const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                logInfo(`[Retry ${attempt}/${MAX_RETRIES}] ${label} returned ${response.status} — retrying in ${delay}ms`);
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            return response;
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                logInfo(`[Retry ${attempt}/${MAX_RETRIES}] ${label} network error — retrying in ${delay}ms`);
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
    throw lastError ?? new Error(`${label} failed after ${MAX_RETRIES} retries`);
}
function getApiBaseUrl() {
    return process.env.COPADO_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE;
}
function getApiVersion() {
    return process.env.COPADO_API_VERSION ?? "2026.1";
}
function getOrgId() {
    const orgId = process.env.COPADO_ORG_ID;
    if (!orgId) {
        throw createApiError("COPADO_ORG_ID is not configured. Add your Copado organization ID to .cursor/mcp.json env.", 400, { code: "MISSING_ORG_ID" });
    }
    return orgId;
}
async function buildAuthHeaders() {
    const token = await getSecureToken();
    return {
        "X-Authorization": token,
        Authorization: token,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Copado-Api-Version": getApiVersion(),
    };
}
function mapAgentResponse(agent, dialogueId, status, message) {
    return DialogueResponseSchema.parse({
        id: dialogueId,
        agent,
        status,
        message,
    });
}
function buildAgentPrompt(agent, payload) {
    const ctx = payload.context;
    const inner = ctx.payload ?? {};
    switch (agent) {
        case "Plan":
            return `Plan user story ${ctx.storyId}${ctx.gitBranch ? ` on branch ${ctx.gitBranch}` : ""}.\n\n${String(inner.userPrompt ?? "")}`;
        case "Build":
            return [
                `Build Agent: ${inner.validateOnly ? "validate only" : "deploy"} for story ${ctx.storyId}.`,
                ctx.gitBranch ? `Git branch: ${ctx.gitBranch}` : "",
                `Metadata components: ${inner.metadataComponents?.join(", ") ?? "none"}`,
                "Return compilation/validation errors with a concrete Apex fix in diff format if validation fails.",
            ]
                .filter(Boolean)
                .join("\n");
        case "Test":
            return [
                `Test Agent: run suite ${inner.testSuiteId} in ${inner.executionEnvironment}.`,
                `Workspace: ${inner.workspaceId}`,
                ctx.storyId ? `Story: ${ctx.storyId}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        case "Operate":
            return `Operate Agent: diagnose this pipeline failure and suggest a fix.\n\n${JSON.stringify(inner.errorContext ?? inner, null, 2)}`;
        default:
            return JSON.stringify(payload);
    }
}
async function sendDialogueMessage(orgId, dialogueId, agent, prompt) {
    const headers = await buildAuthHeaders();
    const requestId = crypto.randomUUID();
    const url = `${getApiBaseUrl()}/organizations/${encodeURIComponent(orgId)}/dialogues/${encodeURIComponent(dialogueId)}/messages`;
    logHttp("POST", `/organizations/${orgId}/dialogues/${dialogueId}/messages`);
    const response = await fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
            request_id: requestId,
            prompt,
            assistantId: AGENT_ASSISTANT_MAP[agent],
        }),
    }, `${agent} message`);
    const data = await parseJsonResponse(response);
    logHttp("POST", ".../messages", response.status);
    if (!response.ok) {
        throw createApiError(`Copado message API error (${response.status})`, response.status, data);
    }
    if (Array.isArray(data)) {
        return data.join("\n");
    }
    if (typeof data.message === "string") {
        return data.message;
    }
    return JSON.stringify(data, null, 2);
}
function createApiError(message, statusCode, responseData) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.responseData = responseData;
    return error;
}
async function parseJsonResponse(response) {
    const text = await response.text();
    if (!text)
        return {};
    try {
        return JSON.parse(text);
    }
    catch {
        return { rawBody: text };
    }
}
async function resolveWorkspaceId(orgId) {
    const configured = process.env.COPADO_WORKSPACE_ID;
    if (configured)
        return configured;
    const headers = await buildAuthHeaders();
    const url = `${getApiBaseUrl()}/organizations/${encodeURIComponent(orgId)}/workspaces`;
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok)
        return undefined;
    const data = await parseJsonResponse(response);
    const workspaces = Array.isArray(data)
        ? data
        : Array.isArray(data.workspaces)
            ? data.workspaces
            : [];
    const first = workspaces[0];
    return first?.id ? String(first.id) : undefined;
}
export async function postDialogue(agent, payload) {
    const orgId = getOrgId();
    const workspaceId = await resolveWorkspaceId(orgId);
    const headers = await buildAuthHeaders();
    const storyId = payload.context.storyId;
    const url = `${getApiBaseUrl()}/organizations/${encodeURIComponent(orgId)}/dialogues`;
    logInfo(renderActionBadge(AGENT_BADGE_MAP[agent], `${agent.toUpperCase()} AGENT INITIATED`));
    logHttp("POST", `/organizations/${orgId}/dialogues`);
    const createBody = {
        name: `${agent} — ${storyId} — ${new Date().toISOString()}`,
        assistantId: AGENT_ASSISTANT_MAP[agent],
    };
    if (workspaceId) {
        createBody.workspaceId = workspaceId;
    }
    const response = await fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify(createBody),
    }, `${agent} dialogue creation`);
    const data = await parseJsonResponse(response);
    logHttp("POST", `/organizations/${orgId}/dialogues`, response.status);
    if (!response.ok) {
        throw createApiError(`Copado Agentia API error (${response.status})`, response.status, data);
    }
    const dialogueId = String(data.id ?? data.dialogue_id ?? "");
    if (!dialogueId) {
        throw createApiError("Copado API returned no dialogue id", 500, data);
    }
    const prompt = buildAgentPrompt(agent, payload);
    const message = await sendDialogueMessage(orgId, dialogueId, agent, prompt);
    const successStatus = agent === "Build" ? "Compiled" : agent === "Test" ? "Running" : "Completed";
    // Only flag as failed for explicit Apex compilation/deployment failures,
    // not general AI discussion of errors in the response text.
    const HARD_FAIL_PATTERN = /\b(compile\s*error|deployment\s+failed|cannot\s+compile|compilation\s+failed|apex\s+exception\s*:)/i;
    const SUCCESS_OVERRIDE = /\b(success|compiled\s+successfully|no\s+errors?|validation\s+passed|deployment\s+succeeded)\b/i;
    const failed = agent === "Build" &&
        HARD_FAIL_PATTERN.test(message) &&
        !SUCCESS_OVERRIDE.test(message);
    return mapAgentResponse(agent, dialogueId, failed ? "Failed" : successStatus, message);
}
export async function planStory(storyId, userPrompt, gitBranch) {
    return postDialogue("Plan", {
        dialogueType: AGENT_DIALOGUE_TYPES.Plan,
        context: {
            storyId,
            gitBranch,
            payload: { userPrompt },
        },
    });
}
export async function buildPackage(storyId, metadataComponents, validateOnly, gitBranch) {
    return postDialogue("Build", {
        dialogueType: AGENT_DIALOGUE_TYPES.Build,
        context: {
            storyId,
            gitBranch,
            payload: { metadataComponents, validateOnly },
        },
    });
}
export async function runTest(workspaceId, testSuiteId, executionEnvironment, storyId, gitBranch) {
    return postDialogue("Test", {
        dialogueType: AGENT_DIALOGUE_TYPES.Test,
        context: {
            storyId: storyId ?? workspaceId,
            gitBranch,
            payload: { workspaceId, testSuiteId, executionEnvironment },
        },
    });
}
export async function fallbackToOperateAgent(errorPayload) {
    logWarningBlock("OPERATE AGENT INTERVENTION", "Pipeline failure detected — routing to autonomous diagnosis");
    logInfo(renderActionBadge("OPERATE", "OPERATE AGENT INITIATED"));
    try {
        const operateResult = await postDialogue("Operate", {
            dialogueType: AGENT_DIALOGUE_TYPES.Operate,
            context: {
                storyId: String(errorPayload.storyId ?? "UNKNOWN"),
                payload: { errorContext: errorPayload, source: "copado-nexus-self-heal" },
            },
        });
        if (operateResult.message) {
            return operateResult.message;
        }
    }
    catch (operateError) {
        const message = operateError instanceof Error ? operateError.message : "Operate Agent unavailable";
        return [
            "## Diagnosis (Offline Fallback)",
            "",
            message,
            "",
            "**Error context:**",
            "",
            "```json",
            JSON.stringify(errorPayload, null, 2),
            "```",
        ].join("\n");
    }
    return "## Operate Agent completed without a detailed diagnosis payload.";
}
export async function resolveWorkspaceForStory(orgId, storyId) {
    const url = `${getApiBaseUrl()}/organizations/${encodeURIComponent(orgId)}/workspaces`;
    const headers = await buildAuthHeaders();
    logHttp("GET", `/organizations/${orgId}/workspaces`);
    const response = await fetch(url, { method: "GET", headers });
    const data = await parseJsonResponse(response);
    logHttp("GET", `/organizations/${orgId}/workspaces`, response.status);
    if (!response.ok) {
        return null;
    }
    const workspaces = Array.isArray(data.workspaces)
        ? data.workspaces
        : Array.isArray(data)
            ? data
            : [];
    return (workspaces.find((ws) => ws.storyId === storyId ||
        ws.userStoryId === storyId ||
        String(ws.name ?? "").includes(storyId)) ?? null);
}
//# sourceMappingURL=client.js.map