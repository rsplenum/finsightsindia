import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TARGET_DIRS = ['src', 'public/images', 'docs/standards'];
const SNAPSHOT_FILE = 'integrity-snapshot.json';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function createSnapshot() {
  const snapshot = {};
  TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getFiles(dir);
      files.forEach(file => {
        snapshot[file] = hashFile(file);
      });
    }
  });
  
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  console.log(`\n🔒 Integrity snapshot created successfully. Saved to ${SNAPSHOT_FILE}`);
  console.log(`Total files secured: ${Object.keys(snapshot).length}\n`);
}

function verifyIntegrity() {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error('❌ Error: No integrity snapshot found. Run `npm run integrity:snapshot` first.');
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
  let alteredFiles = [];
  let newFiles = [];

  const currentFiles = [];
  TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      currentFiles.push(...getFiles(dir));
    }
  });

  // Check for altered or deleted files
  Object.keys(snapshot).forEach(file => {
    if (!fs.existsSync(file)) {
      alteredFiles.push(`${file} (DELETED)`);
    } else {
      const currentHash = hashFile(file);
      if (currentHash !== snapshot[file]) {
        alteredFiles.push(`${file} (MODIFIED)`);
      }
    }
  });

  // Check for new untracked files in these directories
  currentFiles.forEach(file => {
    if (!snapshot[file]) {
      newFiles.push(file);
    }
  });

  if (alteredFiles.length === 0 && newFiles.length === 0) {
    console.log('\n✅ INTEGRITY VERIFIED: All files perfectly match the cryptographic snapshot.');
  } else {
    console.log('\n🚨 INTEGRITY BREACH DETECTED 🚨\n');
    if (alteredFiles.length > 0) {
      console.log('The following files have been altered or deleted:');
      alteredFiles.forEach(f => console.log(`  - ${f}`));
    }
    if (newFiles.length > 0) {
      console.log('\nThe following new files were added outside the snapshot:');
      newFiles.forEach(f => console.log(`  - ${f}`));
    }
    console.log('\nIf these changes are intentional, run `npm run integrity:snapshot` to generate a new baseline.\n');
    process.exit(1);
  }
}

const action = process.argv[2];
if (action === 'snapshot') {
  createSnapshot();
} else if (action === 'verify') {
  verifyIntegrity();
} else {
  console.log('Usage: node verify-integrity.js [snapshot|verify]');
}
