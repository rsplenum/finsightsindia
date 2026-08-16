// Stamp the Launch Gate as synced to the current commit.
//
// This used to print "republish the artifact from docs/launch-gate.html". That
// file has not existed since the gate stopped being 600 lines of hand-patched
// HTML and became the list it is now - dd-011/dont-2, the reason it was
// changed. So the instruction was asking every session to republish nothing,
// which is exactly the "misinforms with authority" failure the gate protocol
// warns about, sitting inside the gate's own tooling. The stamp is a claim
// about docs/launch-gate.md and the tree, and nothing else.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const FILE = 'docs/launch-gate.state.json';
const state = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const sha = execSync('git rev-parse HEAD').toString().trim();
const prev = state.syncedAtCommit;
state.syncedAtCommit = sha;
fs.writeFileSync(FILE, JSON.stringify(state, null, 2) + '\n');
console.log(`Launch Gate synced: ${prev.slice(0, 7)} -> ${sha.slice(0, 7)}`);
console.log('docs/launch-gate.md is the gate. There is no artifact to republish.');
