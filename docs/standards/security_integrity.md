# FinSight Security & Integrity Standards

## The Fort Knox Protocol
FinSight hosts highly sensitive statutory tax data, legal loopholes, and computational formulas. Accidental deletion, unauthorized tampering, or subtle modification of these `.mdx` files or core scripts can lead to catastrophic misinformation for our users.

To prevent this, the project enforces a cryptographic **Integrity Check System**.

## The Mechanism
Located at `scripts/verify-integrity.js`, this Node script uses the native `crypto` module to generate a SHA-256 hash for every file located in critical directories:
- `/src` (All UI components, logic, and MDX articles)
- `/public/images` (All diagrams and UI assets)
- `/docs/standards` (All architectural rules)

## Generating the Baseline Snapshot
Whenever a master branch is approved for production, or a major content push is completed, the Lead Developer must generate a secure snapshot:

```bash
npm run integrity:snapshot
```
This generates the `integrity-snapshot.json` lockfile at the root of the project. **This file must be committed to Git.** It acts as the immutable cryptographic baseline for the project.

## Verifying Integrity
Any future maintainer, auditor, or pipeline can instantly verify that not a single character in the project has been altered by running:

```bash
npm run integrity:verify
```
If a file was modified, deleted, or if an untracked file was injected into the secure directories, the script will instantly throw an alert and exit with Code 1, breaking any CI/CD pipeline attempting to deploy compromised code.
