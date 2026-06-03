import { z } from "zod";
export const GitContextSchema = z.object({
    localBranch: z.string().min(1, "Branch name must be populated"),
    detectedStoryId: z
        .string()
        .regex(/^US-\d+$/, "Invalid Copado User Story format"),
});
export const PlanStoryInputSchema = z.object({
    storyId: z.string(),
    userPrompt: z
        .string()
        .min(10, "Prompt requires explicit descriptive instructions"),
});
export const BuildPackageInputSchema = z.object({
    storyId: z.string(),
    metadataComponents: z
        .array(z.string())
        .nonempty("At least one component must be selected for package compilation"),
    validateOnly: z.boolean().default(true),
});
export const RunTestInputSchema = z.object({
    workspaceId: z.string(),
    testSuiteId: z.string(),
    executionEnvironment: z.enum(["Sandbox", "ScratchOrg", "UAT", "Production"]),
});
export const DialogueResponseSchema = z.object({
    id: z.string(),
    agent: z.enum(["Plan", "Build", "Test", "Release", "Operate"]),
    status: z.string(),
    message: z.string().optional(),
    errors: z.array(z.unknown()).optional(),
    payload: z.record(z.unknown()).optional(),
});
export const OperateDiagnosisSchema = z.object({
    diagnosis: z.string(),
    suggestedFix: z.string().optional(),
    affectedComponents: z.array(z.string()).optional(),
    severity: z.enum(["info", "warning", "critical"]).optional(),
});
export const AGENT_DIALOGUE_TYPES = {
    Plan: "plan_story",
    Build: "build_package",
    Test: "run_test",
    Operate: "operate_diagnosis",
};
//# sourceMappingURL=schemas.js.map