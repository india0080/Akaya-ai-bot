#!/usr/bin/env node
// Prints the affiliate-ID block for a .env.example, generated from the registry so it never drifts.
// Usage: node packages/affiliate/scripts/env-block.mjs [PREFIX]   (the app uses VITE_AFF_)
import { allEnvVars, PLATFORMS, envVarsFor } from '../dist/index.js';

const prefix = process.argv[2] ?? '';
const owners = (v) =>
  Object.values(PLATFORMS)
    .filter((p) => envVarsFor(p).includes(v))
    .map((p) => p.name)
    .join(', ');
console.log('# --- Affiliate IDs (all optional; empty = plain links with UTM only). See docs/AFFILIATE.md ---');
for (const v of allEnvVars()) {
  const o = owners(v).split(", ");
  console.log(`# ${o.length > 3 ? `network: ${o.length} platforms` : o.join(", ")}\n${prefix}${v}=`);
}
