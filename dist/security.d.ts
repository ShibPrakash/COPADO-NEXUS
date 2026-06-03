declare const SERVICE_NAME = "CopadoNexusDevOps";
declare const ACCOUNT_NAME = "SystemMachineToken";
export declare class SecurityError extends Error {
    constructor(message: string);
}
export declare function getSecureToken(): Promise<string>;
export declare function setSecureToken(token: string): Promise<void>;
export declare function deleteSecureToken(): Promise<boolean>;
export { SERVICE_NAME, ACCOUNT_NAME };
//# sourceMappingURL=security.d.ts.map