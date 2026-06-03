import { type GitContext } from "../schemas.js";
declare const STORY_ID_PATTERN: RegExp;
export declare function resolveGitContext(cwd?: string): GitContext;
export declare function tryResolveGitContext(cwd?: string): GitContext | null;
export declare function resolveGitContextViaCli(cwd?: string): GitContext;
export { STORY_ID_PATTERN };
//# sourceMappingURL=context.d.ts.map