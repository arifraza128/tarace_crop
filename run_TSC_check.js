const { execSync } = require('child_process');
const fs = require('fs');
function run(dir, outFile) {
  try {
    const result = execSync('npx tsc --noEmit', { cwd: dir, encoding: 'utf-8' });
    fs.appendFileSync(outFile, `\n=== ${dir} ===\nSUCCESS\n${result}\n`);
  } catch (e) {
    fs.appendFileSync(outFile, `\n=== ${dir} ===\nFAILED\nSTDOUT: ${e.stdout}\nSTDERR: ${e.stderr}\n`);
  }
}
fs.writeFileSync('error.txt', '');
run('artifacts/smart-terrace', 'error.txt');
run('artifacts/mockup-sandbox', 'error.txt');
