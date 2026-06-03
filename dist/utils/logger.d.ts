export type AgentBadge = "PLAN" | "BUILD" | "TEST" | "OPERATE" | "SYSTEM" | "SUCCESS" | "WARNING";
export declare function renderActionBadge(agent: AgentBadge, label: string): string;
export declare function logInfo(message: string): void;
export declare function logHttp(method: string, path: string, status?: number): void;
export declare function logMilestone(message: string): void;
export declare function logWarningBlock(title: string, body: string): void;
export declare function logSuccessBlock(message: string): void;
export declare function renderBootDashboard(gitBranch: string, storyId: string | null): void;
export declare class Spinner {
    private readonly label;
    private interval;
    private frameIndex;
    constructor(label: string);
    start(): void;
    stop(finalMessage?: string): void;
}
export declare function formatDiagnosisOutput(diagnosis: string): string;
export declare function formatToolResult(agent: AgentBadge, title: string, details: Record<string, string>): string;
//# sourceMappingURL=logger.d.ts.map