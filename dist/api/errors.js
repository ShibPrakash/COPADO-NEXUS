import { fallbackToOperateAgent, } from "./client.js";
import { formatDiagnosisOutput } from "../utils/logger.js";
export async function handleApiExecution(apiCall) {
    try {
        return await apiCall();
    }
    catch (error) {
        const apiError = error;
        const statusCode = apiError.statusCode ?? 0;
        const rawErrorPayload = apiError.responseData;
        // For transient server errors (5xx), do NOT cascade to the Operate Agent
        // since it would hit the same failing API. Return a clear message instead.
        if (statusCode >= 500) {
            return formatDiagnosisOutput(`[COPADO API TRANSIENT ERROR — ${statusCode}]\n\n` +
                `The Copado Agentia API returned a server error. This is typically transient.\n` +
                `The request was retried automatically but the API remains unavailable.\n\n` +
                `**Status:** ${statusCode}\n` +
                `**Details:** ${JSON.stringify(rawErrorPayload ?? {}, null, 2)}`);
        }
        // For genuine pipeline failures (4xx with payload), route to Operate Agent
        if (rawErrorPayload && statusCode >= 400 && statusCode < 500) {
            const diagnosis = await fallbackToOperateAgent(rawErrorPayload);
            return formatDiagnosisOutput(`[COPADO AUTONOMOUS DIAGNOSIS VIA OPERATE AGENT]:\n${diagnosis}`);
        }
        if (error instanceof Error && error.name === "SecurityError") {
            return `System Pipeline Exception: ${error.message}`;
        }
        const message = error instanceof Error ? error.message : "Unknown pipeline exception";
        return `System Pipeline Exception: ${message}`;
    }
}
export function isFailureStatus(status) {
    const normalized = status.toLowerCase();
    return (normalized.includes("fail") ||
        normalized.includes("error") ||
        normalized.includes("invalid") ||
        normalized === "rejected");
}
export async function handlePipelineFailure(errorContext) {
    const diagnosis = await fallbackToOperateAgent(errorContext);
    return formatDiagnosisOutput(`[COPADO AUTONOMOUS DIAGNOSIS VIA OPERATE AGENT]:\n${diagnosis}`);
}
//# sourceMappingURL=errors.js.map