// Runs the Next.js CLI with telemetry disabled: no data leaves the operator's deployment.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const bin = createRequire(import.meta.url).resolve('next/dist/bin/next');
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
child.on('exit', (code) => process.exit(code ?? 1));
