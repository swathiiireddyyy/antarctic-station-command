const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'SIH_Description.pdf');
const url = 'http://localhost:4000/description.html';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Generating Description PDF...');
try {
  execSync(`"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outPath}" "${url}"`, {
    timeout: 30000,
    stdio: 'pipe'
  });
  if (fs.existsSync(outPath)) {
    const size = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`✅ PDF saved! Size: ${size} KB`);
    console.log(`📁 Path: ${outPath}`);
  } else {
    console.log('Checking alternate locations...');
    const home = process.env.USERPROFILE;
    const alts = [`${home}\\SIH_Description.pdf`, `${home}\\Downloads\\SIH_Description.pdf`, 'C:\\Users\\ASUS\\SIH_Description.pdf'];
    for (const p of alts) {
      if (fs.existsSync(p)) {
        console.log(`Found at: ${p}`);
        fs.copyFileSync(p, outPath);
        console.log(`✅ Copied to: ${outPath}`);
        break;
      }
    }
  }
} catch (e) {
  console.log('Edge error:', e.stderr?.toString() || e.message);
}
