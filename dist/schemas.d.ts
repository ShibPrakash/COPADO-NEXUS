import { z } from "zod";
export declare const GitContextSchema: z.ZodObject<{
    localBranch: z.ZodString;
    detectedStoryId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    localBranch: string;
    detectedStoryId: string;
}, {
    localBranch: string;
    detectedStoryId: string;
}>;
export type GitContext = z.infer<typeof GitContextSchema>;
export declare const PlanStoryInputSchema: z.ZodObject<{
    storyId: z.ZodString;
    userPrompt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    storyId: string;
    userPrompt: string;
}, {
    storyId: string;
    userPrompt: string;
}>;
export type PlanStoryInput = z.infer<typeof PlanStoryInputSchema>;
export declare const BuildPackageInputSchema: z.ZodObject<{
    storyId: z.ZodString;
    metadataComponents: z.ZodArray<z.ZodString, "atleastone">;
    validateOnly: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    storyId: string;
    metadataComponents: [string, ...string[]];
    validateOnly: boolean;
}, {
    storyId: string;
    metadataComponents: [string, ...string[]];
    validateOnly?: boolean | undefined;
}>;
export type BuildPackageInput = z.infer<typeof BuildPackageInputSchema>;
export declare const RunTestInputSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    testSuiteId: z.ZodString;
    executionEnvironment: z.ZodEnum<["Sandbox", "ScratchOrg", "UAT", "Production"]>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    testSuiteId: string;
    executionEnvironment: "Sandbox" | "ScratchOrg" | "UAT" | "Production";
}, {
    workspaceId: string;
    testSuiteId: string;
    executionEnvironment: "Sandbox" | "ScratchOrg" | "UAT" | "Production";
}>;
export type RunTestInput = z.infer<typeof RunTestInputSchema>;
export declare const DialogueResponseSchema: z.ZodObject<{
    id: z.ZodString;
    agent: z.ZodEnum<["Plan", "Build", "Test", "Release", "Operate"]>;
    status: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: string;
    id: string;
    agent: "Plan" | "Build" | "Test" | "Release" | "Operate";
    message?: string | undefined;
    errors?: unknown[] | undefined;
    payload?: Record<string, unknown> | undefined;
}, {
    status: string;
    id: string;
    agent: "Plan" | "Build" | "Test" | "Release" | "Operate";
    message?: string | undefined;
    errors?: unknown[] | undefined;
    payload?: Record<string, unknown> | undefined;
}>;
export type DialogueResponse = z.infer<typeof DialogueResponseSchema>;
export declare const OperateDiagnosisSchema: z.ZodObject<{
    diagnosis: z.ZodString;
    suggestedFix: z.ZodOptional<z.ZodString>;
    affectedComponents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    severity: z.ZodOptional<z.ZodEnum<["info", "warning", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    diagnosis: string;
    suggestedFix?: string | undefined;
    affectedComponents?: string[] | undefined;
    severity?: "info" | "warning" | "critical" | undefined;
}, {
    diagnosis: string;
    suggestedFix?: string | undefined;
    affectedComponents?: string[] | undefined;
    severity?: "info" | "warning" | "critical" | undefined;
}>;
export type OperateDiagnosis = z.infer<typeof OperateDiagnosisSchema>;
export interface CopadoAgentiaPayload {
    dialogueType: string;
    context: {
        storyId: string;
        gitBranch?: string;
        payload?: Record<string, unknown>;
    };
}
export declare const AGENT_DIALOGUE_TYPES: {
    readonly Plan: "plan_story";
    readonly Build: "build_package";
    readonly Test: "run_test";
    readonly Operate: "operate_diagnosis";
};
export type AgentName = keyof typeof AGENT_DIALOGUE_TYPES;
//# sourceMappingURL=schemas.d.ts.map