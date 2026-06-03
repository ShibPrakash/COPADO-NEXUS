import { type AgentName, type CopadoAgentiaPayload, type DialogueResponse } from "../schemas.js";
export interface ApiExecutionError extends Error {
    statusCode?: number;
    responseData?: Record<string, unknown>;
}
export declare function postDialogue(agent: AgentName, payload: CopadoAgentiaPayload): Promise<DialogueResponse>;
export declare function planStory(storyId: string, userPrompt: string, gitBranch?: string): Promise<DialogueResponse>;
export declare function buildPackage(storyId: string, metadataComponents: string[], validateOnly: boolean, gitBranch?: string): Promise<DialogueResponse>;
export declare function runTest(workspaceId: string, testSuiteId: string, executionEnvironment: string, storyId?: string, gitBranch?: string): Promise<DialogueResponse>;
export declare function fallbackToOperateAgent(errorPayload: Record<string, unknown>): Promise<string>;
export declare function resolveWorkspaceForStory(orgId: string, storyId: string): Promise<Record<string, unknown> | null>;
//# sourceMappingURL=client.d.ts.map