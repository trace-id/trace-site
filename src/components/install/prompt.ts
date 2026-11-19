/** The one prompt we hand to coding agents. The guide it points to is served at /install.md. */
export function installPrompt(origin: string): string {
  return `Add Trace device identification to this app. Read ${origin}/install.md and follow it step by step. Ask me for TRACE_ENDPOINT, TRACE_PUBLIC_KEY and TRACE_SECRET_KEY if they are not already in the environment, and never commit real keys. Show me the diff when you are done.`;
}

export const MCP_COMMAND = 'claude mcp add trace -e TRACE_ENDPOINT=https://id.example.com -e TRACE_SECRET_KEY=sk_... -- npx -y @trace-id/mcp';
export const NPM_COMMAND = 'npm install @trace-id/sdk-js';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
