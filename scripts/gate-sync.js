// Stamp the Launch Gate as synced to the current commit.
// Run this in the SAME commit that republishes the artifact - the stamp is a
// claim that the published page reflects this state of the tree.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const FILE = 'docs/launch-gate.state.json';
const state = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
const sha = execSync('git rev-parse HEAD').toString().trim();
const prev = state.syncedAtCommit;
state.syncedAtCommit = sha;
fs.writeFileSync(FILE, JSON.stringify(state, null, 2) + '\n');
console.log(`Launch Gate synced: ${prev.slice(0, 7)} -> ${sha.slice(0, 7)}`);
console.log('Republish the artifact from docs/launch-gate.html if you have not already.');
