export declare function handleApiExecution<T>(apiCall: () => Promise<T>): Promise<T | string>;
export declare function isFailureStatus(status: string): boolean;
export declare function handlePipelineFailure(errorContext: Record<string, unknown>): Promise<string>;
//# sourceMappingURL=errors.d.ts.map