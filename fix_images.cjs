const fs = require('fs');
const path = require('path');
const dir = 'src/assets/images';
const validJpg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", 'base64');
function fixDir(d) {
  const files = fs.readdirSync(d);
  for (const file of files) {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.jpg')) {
      const content = fs.readFileSync(fullPath);
      // If it doesn't start with jpeg magic number, replace it
      if (content[0] !== 0xFF || content[1] !== 0xD8) {
        console.log('Fixing', fullPath);
        fs.writeFileSync(fullPath, validJpg);
      }
    }
  }
}
fixDir(dir);
