import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// The Launch Gate was the only durable store with no failure mode.
//
// Everything else that held up today breaks loudly when neglected: a commit
// cannot be made without a message, the jargon ratchet turns the suite red,
// the engine invariants fail, the doctrine checks fail. The gate had only a
// promise - it lived outside the repo, git could not see it, `npm run verify`
// did not know it existed, and nothing emitted a signal when code outran it.
//
// So it aged two commits behind within hours of a protocol saying it must be
// updated in the same turn. Strengthening the wording had already been tried
// once, on a different rule, and had already failed. dd-000 now requires that
// a rule broken twice gets a mechanism instead.
//
// This is that mechanism: if commits have touched the watched paths since the
// gate was last stamped, the suite says so and names them.

const STATE = 'docs/launch-gate.state.json';

const hasGit = (() => {
  try { execSync('git rev-parse HEAD', { stdio: 'pipe' }); return true; }
  catch { return false; }
})();

describe.skipIf(!hasGit || !fs.existsSync(STATE))('the Launch Gate must not silently age', () => {
  const state = JSON.parse(fs.readFileSync(STATE, 'utf-8'));

  const commitsSince = (): string[] => {
    const paths = (state.watchedPaths as string[]).join(' ');
    try {
      const out = execSync(
        `git log --oneline ${state.syncedAtCommit}..HEAD -- ${paths}`,
        { stdio: 'pipe' }
      ).toString().trim();
      return out ? out.split('\n') : [];
    } catch {
      // The stamped commit is unreachable (rebase, shallow clone). Report
      // rather than pass silently - an unverifiable claim is not a passing one.
      return ['<stamped commit unreachable - re-run npm run gate:sync>'];
    }
  };

  it('records which commit it was last synced to', () => {
    expect(state.syncedAtCommit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(state.artifactUrl).toContain('artifact');
  });

  it('has not fallen behind the work it is meant to describe', () => {
    const behind = commitsSince();
    expect(
      behind.length,
      `The Launch Gate is ${behind.length} commit(s) behind:\n` +
      behind.map((c) => `  ${c}`).join('\n') +
      `\n\nUpdate docs/launch-gate.html, republish the artifact, then run ` +
      `\`npm run gate:sync\` in the same commit. A stale tracker misinforms ` +
      `with authority, which is worse than not having one.`
    ).toBeLessThanOrEqual(state.maxCommitsBehind);
  });

  it('the published source lives in the repo, where git can see it', () => {
    // It used to live only in a scratchpad, which is why nothing could tell
    // it had drifted.
    expect(fs.existsSync('docs/launch-gate.html')).toBe(true);
    expect(fs.statSync('docs/launch-gate.html').size).toBeGreaterThan(5000);
  });
});
