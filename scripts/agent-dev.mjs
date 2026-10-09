#!/usr/bin/env node
// Runs an agent's backend + frontend together with prefixed output (no extra dependencies).
// Used by agents/<name>/package.json `npm run dev` (cwd = the agent folder).
import { spawn } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const procs = [
  ['api', 'backend', '\x1b[35m'],
  ['web', 'frontend', '\x1b[36m'],
].map(([name, dir, color]) => {
  const p = spawn(npm, ['run', 'dev'], { cwd: `${process.cwd()}/${dir}`, env: process.env, shell: process.platform === 'win32' });
  const out = (stream) => (buf) => buf.toString().split('\n').filter(Boolean).forEach((l) => stream.write(`${color}[${name}]\x1b[0m ${l}\n`));
  p.stdout.on('data', out(process.stdout));
  p.stderr.on('data', out(process.stderr));
  p.on('exit', (code) => {
    console.log(`[${name}] exited with ${code}`);
    procs.forEach((x) => x.kill());
    process.exit(code ?? 0);
  });
  return p;
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => procs.forEach((p) => p.kill(sig)));
