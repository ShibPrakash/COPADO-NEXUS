import keytar from "keytar";
const SERVICE_NAME = "CopadoNexusDevOps";
const ACCOUNT_NAME = "SystemMachineToken";
export class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = "SecurityError";
    }
}
export async function getSecureToken() {
    try {
        const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (!token) {
            throw new SecurityError("CRITICAL: Copado Authentication credentials missing from system keychain.");
        }
        return token;
    }
    catch (error) {
        if (error instanceof SecurityError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : "Unknown keychain access failure";
        throw new SecurityError(`CRITICAL: Unable to retrieve Copado credentials from system keychain — ${message}`);
    }
}
export async function setSecureToken(token) {
    if (!token || token.trim().length === 0) {
        throw new SecurityError("CRITICAL: Cannot store an empty Copado authentication token.");
    }
    try {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token.trim());
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown keychain write failure";
        throw new SecurityError(`CRITICAL: Unable to persist Copado credentials to system keychain — ${message}`);
    }
}
export async function deleteSecureToken() {
    try {
        return await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown keychain delete failure";
        throw new SecurityError(`CRITICAL: Unable to remove Copado credentials from system keychain — ${message}`);
    }
}
export { SERVICE_NAME, ACCOUNT_NAME };
//# sourceMappingURL=security.js.map